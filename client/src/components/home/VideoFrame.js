"use client";

import React from 'react';

const VideoInFrame = ({video}) => {
    return (
      <div className="flex justify-center items-center">
        {/* Container for the phone frame */}
        <div className="relative w-[280px] md:w-[350px] h-[560px] md:h-[700px] transform scale-90 md:scale-100">
          {/* The phone frame image */}
          <img src='/frame.webp' alt="Phone Frame" className="absolute inset-0 w-full h-full" />
  
          {/* The video inside the frame */}
          <video
            src={video}
            autoPlay
            loop
            muted
            // controls
            className="absolute top-[3%] md:top-[18px] left-[6%] w-[89%] h-[95%] object-cover rounded-[40px]"
          />
        </div>
      </div>
    );
};

export default VideoInFrame;
