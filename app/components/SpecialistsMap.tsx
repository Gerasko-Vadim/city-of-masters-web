"use client";

import dynamic from "next/dynamic";

const SpecialistsTwoGisMap = dynamic(() => import("./SpecialistsTwoGisMap"), { ssr: false });

type Props = {
  specialists: any[];
};

export default function SpecialistsMap(props: Props) {
  return <SpecialistsTwoGisMap {...props} />;
}
