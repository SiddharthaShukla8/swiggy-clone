import React from 'react';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

export const RestaurantSkeleton = ({ count = 4 }) => {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12">
            {Array(count).fill(0).map((_, i) => (
                <div key={i} className="space-y-4">
                    <Skeleton height={200} borderRadius={24} />
                    <Skeleton width="80%" height={24} />
                    <div className="flex gap-2">
                        <Skeleton width={30} height={16} />
                        <Skeleton width={60} height={16} />
                    </div>
                    <Skeleton width="60%" height={16} />
                </div>
            ))}
        </div>
    );
};

export const CategorySkeleton = ({ count = 6 }) => {
    return (
        <div className="flex gap-12 overflow-hidden py-4">
            {Array(count).fill(0).map((_, i) => (
                <div key={i} className="flex-shrink-0 flex flex-col items-center gap-4">
                    <Skeleton circle width={144} height={144} />
                    <Skeleton width={80} height={16} />
                </div>
            ))}
        </div>
    );
};

export const BannerSkeleton = () => {
    return (
        <div className="w-full h-[400px] md:h-[500px]">
            <Skeleton height="100%" borderRadius={0} />
        </div>
    );
};
