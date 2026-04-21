export const getRestaurantBadge = (restaurant = {}) => {
    const cuisines = restaurant.cuisines || [];
    const rating = Number(restaurant.averageRating || 0);
    const deliveryTime = Number(restaurant.deliveryTime || 0);

    if (restaurant.isPureVeg) {
        return {
            title: "Pure Veg",
            subtitle: cuisines[0] ? cuisines[0].toUpperCase() : "VEG MENU",
            accent: "veg",
        };
    }

    if (rating >= 4.5) {
        return {
            title: "Top Rated",
            subtitle: `${rating.toFixed(1)} RATING`,
            accent: "primary",
        };
    }

    if (deliveryTime > 0 && deliveryTime <= 25) {
        return {
            title: "Fast Delivery",
            subtitle: `IN ${deliveryTime} MINS`,
            accent: "primary",
        };
    }

    return {
        title: cuisines[0] || "Popular Choice",
        subtitle: deliveryTime > 0 ? `${deliveryTime} MINS DELIVERY` : "DISCOVER MENU",
        accent: "primary",
    };
};
