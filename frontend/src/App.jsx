import React, { lazy, Suspense } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Toaster, toast } from 'react-hot-toast'
import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { HelmetProvider } from 'react-helmet-async'

import CartConflictModal from './components/CartConflictModal'
import { BannerSkeleton } from './components/skeletons/AppSkeletons'

// Redux
import { clearCartLocal, getCart, recalculateTotals } from './redux/slices/cartSlice'
import { clearSession } from './redux/slices/authSlice'
import { resetLocation } from './redux/slices/locationSlice'
import { AUTH_EXPIRED_EVENT } from './services/authStorage'
import { isLegacyFallbackLocationState } from './utils/geolocation'

// Lazy loaded pages
const LandingPage = lazy(() => import('./pages/LandingPage'));
const CartPage = lazy(() => import('./pages/CartPage'));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'));
const OrderSuccess = lazy(() => import('./pages/OrderSuccess'));
const OwnerDashboard = lazy(() => import('./pages/OwnerDashboard'));
const DeliveryDashboard = lazy(() => import('./pages/DeliveryDashboard'));
const OrderTracking = lazy(() => import('./pages/OrderTracking'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const SignupPage = lazy(() => import('./pages/SignupPage'));
const SearchPage = lazy(() => import('./pages/SearchPage'));
const MyOrders = lazy(() => import('./pages/MyOrders'));
const RestaurantDetail = lazy(() => import('./pages/RestaurantDetail'));
const OAuthCallback = lazy(() => import('./pages/OAuthCallback'));

import ProtectedRoute from './components/ProtectedRoute'

// ... existing code ...

function App() {
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state) => state.auth);
  const location = useSelector((state) => state.location);

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(getCart());
    } else {
      dispatch(recalculateTotals());
    }
  }, [dispatch, isAuthenticated]);

  useEffect(() => {
    const handleAuthExpired = () => {
      dispatch(clearSession());
      dispatch(clearCartLocal());
      toast.error('Your session expired. Please sign in again.');
    };

    window.addEventListener(AUTH_EXPIRED_EVENT, handleAuthExpired);

    return () => {
      window.removeEventListener(AUTH_EXPIRED_EVENT, handleAuthExpired);
    };
  }, [dispatch]);

  useEffect(() => {
    if (isLegacyFallbackLocationState(location)) {
      dispatch(resetLocation());
    }
  }, [dispatch, location]);

  return (
    <HelmetProvider>
      <Router>
        <div className="App overflow-x-hidden">
          <Toaster 
            position="bottom-center" 
            toastOptions={{
              style: {
                background: '#282c3f',
                color: '#fff',
                fontSize: '14px',
                fontWeight: 'bold',
                borderRadius: '12px',
                padding: '12px 24px'
              }
            }} 
          />
          <CartConflictModal />
          <Suspense fallback={<BannerSkeleton />}>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/restaurant/:id" element={<RestaurantDetail />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/google-callback" element={<OAuthCallback />} />
              
              {/* Customer Routes */}
              <Route path="/cart" element={<CartPage />} />
              <Route path="/checkout" element={
                <ProtectedRoute allowedRoles={["CUSTOMER"]}>
                  <CheckoutPage />
                </ProtectedRoute>
              } />
              <Route path="/orders" element={
                <ProtectedRoute allowedRoles={["CUSTOMER"]}>
                  <MyOrders />
                </ProtectedRoute>
              } />
              <Route path="/order-success" element={<OrderSuccess />} />
              <Route path="/order/tracking/:orderId" element={<OrderTracking />} />
              
              {/* Owner Routes */}
              <Route path="/owner-dashboard" element={
                <ProtectedRoute allowedRoles={["RESTAURANT_OWNER"]}>
                  <OwnerDashboard />
                </ProtectedRoute>
              } />
              
              {/* Delivery Routes */}
              <Route path="/delivery-dashboard" element={
                <ProtectedRoute allowedRoles={["DELIVERY_PARTNER"]}>
                  <DeliveryDashboard />
                </ProtectedRoute>
              } />
              
              {/* Admin Routes */}
              <Route path="/admin" element={
                <ProtectedRoute allowedRoles={["ADMIN"]}>
                  <AdminDashboard />
                </ProtectedRoute>
              } />
            </Routes>
          </Suspense>
        </div>
      </Router>
    </HelmetProvider>
  )
}

export default App
