"use client";
import Image from "next/image";
import React from "react";
import LanguageSelector from "./LanguageSelector";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";

const Banner = () => {
  const { t } = useLanguage();
  return (
    <div
      className="min-h-[469px] max-w-[1440px] mx-auto flex items-center bg-cover bg-center py-10 md:py-0"
      style={{ backgroundImage: `url('/bannerbg.png')` }}
    >
      <div className="flex flex-col md:flex-row justify-between items-center w-[90%] mx-auto gap-8 md:gap-4">
        <div className="w-full md:w-1/2 order-2 md:order-1">
          <Image
            src={"/banner.png"}
            width={400}
            height={300}
            alt="banner image"
            className="mx-auto md:mx-0 w-full max-w-[350px] md:max-w-[400px]"
          />
        </div>

        <div className="w-full md:w-1/2 order-1 md:order-2 text-center md:text-left">
          <h3 className="text-3xl md:text-[45px] leading-tight md:leading-[55px] text-[#074C77] font-medium">
            Practice Languages with <br className="hidden md:block" /> Native Speakers
          </h3>
          <p className="text-lg md:text-xl font-bold text-[#407023] leading-normal md:leading-[41px] my-3">
            Join us in our mission to save nature! We&apos;re dedicating 10% of
            our income to green initiatives
          </p>
          <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-5 items-center md:items-start">
            <LanguageSelector />
            <Link href={"/learning"} className="w-full md:w-auto">
              <button className="w-full md:w-auto hover:text-[#074C77] hover:bg-transparent text-base font-normal py-2 border-2 border-[#074C77] px-6 md:px-10 rounded-full bg-[#074C77] text-white">
                Start to learn languages
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Banner;
