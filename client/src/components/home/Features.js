"use client";
import Image from "next/image";
import React, { useState } from "react";
import { FiMessageSquare, FiVideo, FiCheck, FiGlobe } from "react-icons/fi"; // React icons for the buttons
import { BsChatTextFill } from "react-icons/bs";
import VideoInFrame from "./VideoFrame";

const Features = () => {
  const [imgSrc, setImgSrc] = useState("/phone1.png");
  const [activeTab, setActiveTab] = useState("Chat");

  const tabs = [
    { name: "Chat", icon: <BsChatTextFill /> },
    { name: "Video", icon: <FiVideo /> },
    { name: "Correction", icon: <FiCheck /> },
    { name: "Translate", icon: <FiGlobe /> },
  ];
  return (
    <div className="text-[#074C77] px-4 py-8 md:py-16">
      <h2 className="text-center text-3xl md:text-5xl leading-tight md:leading-[60px]">
        Irma and Jane met on <br className="hidden md:block" />
        the <span className="font-bold text-black">app Enlighten</span>...
      </h2>
      
      <div className="flex flex-col md:flex-row items-center mx-auto justify-center my-6 md:my-10 md:space-x-10">
        <div className="mb-8 md:mb-0">
          {activeTab === "Chat" && <Image src={imgSrc} width={456} height={0} alt="phone 1" className="max-w-full md:max-w-[350px] max-h-[700px]" />}
          {activeTab === "Video" && <VideoInFrame video={"/video.mp4"}/>}
          {activeTab === "Correction" && <VideoInFrame video={"/correction.mp4"}/>}
          {activeTab === "Translate" && <VideoInFrame video={"/translate.mp4"}/>}
        </div>
        
        <div className="w-full md:w-1/2 px-2 md:px-10">
          {/* mobile screen change tab */}
          <div className="flex justify-center py-4">
            {tabs.map((tab) => (
              <div
                key={tab.name}
                className={`flex flex-col justify-between items-center cursor-pointer pb-2 w-full ${
                  activeTab === tab.name ? "text-[#2cc1d7] border-b-4 border-[#2cc1d7]" : "text-gray-400"
                }`}
                onClick={() => setActiveTab(tab.name)}
              >
                <div
                  className={`p-3 md:p-6 rounded-full border-2 text-xl md:text-3xl font-extrabold ${
                    activeTab === tab.name
                      ? "border-[#2cc1d7]"
                      : "border-gray-300"
                  }`}
                >
                  {tab.icon}
                </div>
                <span
                  className={`mt-2 text-sm md:text-base ${
                    activeTab === tab.name
                      ? "text-[#2cc1d7] font-semibold"
                      : "text-gray-500"
                  }`}
                >
                  {tab.name}
                </span>
              </div>
            ))}
          </div>
          <p className="text-xl md:text-3xl font-medium leading-normal md:leading-[45px] tracking-[0.5px] mt-8 md:mt-20 px-2 md:px-10 text-center md:text-left">
            ...and use Enlighten's intuitive interface and support features to help you learn a language together! Irma helps Jane with German, Jane helps Irma with English.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Features;
