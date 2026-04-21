# Swiggy Clone - MERN Stack

A feature-rich, full-stack Swiggy clone built using the MERN ecosystem. This project implements advanced features like real-time order tracking, role-based dashboards, secure payment integration, and a premium UI/UX inspired by modern food delivery platforms.

## 🚀 Features

- **User Authentication**: Secure Sign-in/Sign-up with JWT and Google OAuth2.0 integration.
- **Role-Based Access Control**: Separate dashboards and functionalities for **Users**, **Restaurant Owners**, **Delivery Partners**, and **Admins**.
- **Restaurant Management**: Owners can manage their profile, menu items (add/edit/delete), and track orders.
- **Advanced Search**: Search for restaurants and food items with debounced suggestions.
- **Cart & Order Lifecycle**:
  - Atomic cart management.
  - Multi-step checkout process.
  - Razorpay payment gateway integration.
  - Real-time order status updates via Socket.io.
- **Order Tracking**: Interactive live order tracking for users and delivery assignment logic.
- **Location Services**: Geolocation integration using Geoapify and Leaflet for map visualizations.
- **Reviews & Ratings**: Comprehensive review system for restaurants and food items.
- **Coupons & Notifications**: Coupon management and real-time push notifications.
- **Performance**: High-speed data caching with Redis (Upstash) and image optimization with Cloudinary.

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 19 (Vite)
- **State Management**: Redux Toolkit, React Query
- **Styling**: Tailwind CSS, Framer Motion (Animations)
- **Maps**: Leaflet, React Leaflet
- **Real-time**: Socket.io-client

### Backend
- **Server**: Node.js, Express 5
- **Database**: MongoDB (Mongoose)
- **Caching**: Upstash Redis
- **Authentication**: Passport.js (JWT + Google OAuth)
- **Payments**: Razorpay SDK
- **File Storage**: Cloudinary (Multer)
- **Security**: Helmet, HPP, Express Rate Limit

## ⚙️ Installation & Setup

### Prerequisites
- Node.js (v18+)
- MongoDB Atlas Account
- Upstash Redis Account
- Cloudinary Account
- Razorpay Account
- Geoapify API Key

### Steps

1. **Clone the Repository**
   ```bash
   git clone https://github.com/SiddharthaShukla8/swiggy-clone.git
   cd swiggy-clone
   ```

2. **Install Dependencies**
   Install root, backend, and frontend dependencies:
   ```bash
   npm install
   cd backend && npm install
   cd ../frontend && npm install
   cd ..
   ```

3. **Environment Variables**
   Create a `.env` file in the `backend` directory based on the following template:

   ```env
   PORT=5001
   MONGODB_URI=your_mongodb_uri
   JWT_ACCESS_SECRET=your_access_secret
   JWT_REFRESH_SECRET=your_refresh_secret
   UPSTASH_REDIS_REST_URL=your_redis_url
   UPSTASH_REDIS_REST_TOKEN=your_redis_token
   GEOAPIFY_API_KEY=your_geoapify_key
   RAZORPAY_KEY_ID=your_razorpay_id
   RAZORPAY_KEY_SECRET=your_razorpay_secret
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_cloudinary_key
   CLOUDINARY_API_SECRET=your_cloudinary_secret
   CORS_ORIGIN=http://localhost:5173
   FRONTEND_URL=http://localhost:5173
   ```

   Create a `.env` file in the `frontend` directory:
   ```env
   VITE_API_URL=http://localhost:5001/api/v1
   VITE_API_BASE_URL=http://localhost:5001
   VITE_RAZORPAY_KEY_ID=your_razorpay_id
   VITE_GEOAPIFY_API_KEY=your_geoapify_key
   ```

4. **Run the Project**
   From the root directory:
   ```bash
   npm run swiggy
   ```
   This will start both the backend (5001) and frontend (5173/5175) concurrently.

## 📖 Scripts

- `npm run server`: Starts the backend server in development mode.
- `npm run client`: Starts the frontend development server.
- `npm run swiggy`: Starts both frontend and backend concurrently.

## 📁 Project Structure

```text
├── backend/            # Express server, routes, models, controllers
├── frontend/           # React client, redux, components, pages
├── package.json        # Root scripts and dependencies
└── .gitignore          # Root ignore file
```

## 👨‍💻 Author

**Siddhartha Shukla**
- GitHub: [@SiddharthaShukla8](https://github.com/SiddharthaShukla8)
- Portfolio: [Coming Soon]

## 📜 License
This project is licensed under the ISC License.
