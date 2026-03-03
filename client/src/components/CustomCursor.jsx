import React, { useEffect, useState } from 'react';

const CustomCursor = () => {
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [followerPos, setFollowerPos] = useState({ x: 0, y: 0 });
    const [isHovered, setIsHovered] = useState(false);

    useEffect(() => {
        const moveCursor = (e) => {
            setPosition({ x: e.clientX, y: e.clientY });
            // Follower lag effect
            setTimeout(() => {
                setFollowerPos({ x: e.clientX, y: e.clientY });
            }, 100);
        };

        const handleHoverStart = (e) => {
            if (e.target.closest('button, a, .option-card, input')) {
                setIsHovered(true);
            } else {
                setIsHovered(false);
            }
        };

        window.addEventListener('mousemove', moveCursor);
        window.addEventListener('mouseover', handleHoverStart);

        return () => {
            window.removeEventListener('mousemove', moveCursor);
            window.removeEventListener('mouseover', handleHoverStart);
        };
    }, []);

    return (
        <>
            <div
                className={`custom-cursor ${isHovered ? 'hovered' : ''}`}
                style={{
                    left: `${position.x}px`,
                    top: `${position.y}px`,
                }}
            />
            <div
                className={`custom-cursor-follower ${isHovered ? 'hovered' : ''}`}
                style={{
                    left: `${followerPos.x}px`,
                    top: `${followerPos.y}px`,
                    transform: `translate(-50%, -50%) ${isHovered ? 'scale(1.5)' : 'scale(1)'}`
                }}
            />
        </>
    );
};

export default CustomCursor;
