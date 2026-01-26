"use client";

import dynamic from "next/dynamic";

const LeafletMap = dynamic(() => import("./SpecialistsMapLeaflet"), { ssr: false });

type Props = {
  specialists: any[];
};

export default function SpecialistsMap(props: Props) {
  return <LeafletMap {...props} />;
}
