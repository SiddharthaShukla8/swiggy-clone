import React, { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useSelector, useDispatch } from "react-redux";
import { addNotification, fetchNotifications } from "../redux/slices/notificationSlice";
import api from "../services/api";
import toast from "react-hot-toast";

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

const getSocketBaseUrl = () => {
    const configuredApiUrl = import.meta.env.VITE_API_URL;

    if (configuredApiUrl) {
        return configuredApiUrl.replace(/\/api\/v\d+\/?$/, "");
    }

    return import.meta.env.VITE_API_BASE_URL || "http://localhost:5001";
};

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const dispatch = useDispatch();
    const { isAuthenticated, user } = useSelector((state) => state.auth);

    // Audio Alert Helper
    const playAlert = (type = "notification") => {
        try {
            const audio = new Audio(type === "new_order" 
                ? "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3" // Urgent chime
                : "https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3" // Soft ping
            );
            audio.play();
        } catch (e) {
            console.warn("Audio playback disabled by browser policy");
        }
    };

    useEffect(() => {
        if (isAuthenticated && user) {
            // Initial fetch of notification history
            dispatch(fetchNotifications());

            const newSocket = io(getSocketBaseUrl(), { withCredentials: true });
            setSocket(newSocket);

            newSocket.on("connect", () => {
                console.log("Connected to Real-time service");
                // Join universal notification room
                newSocket.emit("join_user", user._id);

                // Role specific rooms
                if (user.role === "RESTAURANT_OWNER") {
                    api.get("/restaurants/my")
                        .then((response) => {
                            const restaurantId = response.data?.data?._id;

                            if (restaurantId) {
                                newSocket.emit("join_owner", restaurantId);
                            }
                        })
                        .catch(() => {});
                }
                if (user.role === "DELIVERY_PARTNER") {
                    newSocket.emit("join_delivery", user._id);
                }
            });

            // Unified Notification Listener (Persistent)
            newSocket.on("notification", (notif) => {
                dispatch(addNotification(notif));
                
                // UX Feedback
                toast.success(notif.title, {
                    description: notif.message,
                    icon: '🔔'
                });

                // Play sound for critical roles
                if (user.role !== "CUSTOMER") {
                    playAlert("new_order");
                } else {
                    playAlert("notification");
                }
            });

            // Immediate UI feedback for order status (Non-persistent real-time updates)
            newSocket.on("order_status_update", (data) => {
                // Tracking page listens to this too, we just show a toast here
                toast.success(`Order Update: ${data.status.replace(/_/g, " ")}`, { icon: '🛵' });
            });

            newSocket.on("new_order", (data) => {
                if (user.role === "RESTAURANT_OWNER") {
                    toast.success("New Order Incoming!", { icon: '🔥', duration: 6000 });
                    playAlert("new_order");
                }
            });

            newSocket.on("new_delivery_request", (data) => {
                if (user.role === "DELIVERY_PARTNER") {
                    toast("New Delivery Task Nearby!", { icon: '📦' });
                    playAlert("new_order");
                }
            });

            return () => {
                newSocket.close();
            };
        }
    }, [isAuthenticated, user, dispatch]);

    return <SocketContext.Provider value={{ socket, playAlert }}>{children}</SocketContext.Provider>;
};
