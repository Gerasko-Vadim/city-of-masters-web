"use client";

import dynamic from "next/dynamic";

const TwoGisMap = dynamic(() => import("./TwoGisMap"), { ssr: false });

type Props = {
  value?: { lat: number; lng: number };
  onChange: (lat: number, lng: number) => void;
};

export function MapPicker(props: Props) {
  return <TwoGisMap {...props} />;
}
