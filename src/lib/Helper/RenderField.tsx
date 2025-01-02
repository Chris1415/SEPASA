import { Field } from "@/types/sitecore";
import { Checkbox } from "@headlessui/react";
import Image from "next/image";
import React, { ReactElement, useState } from "react";

interface RenderSitecoreFieldProps {
  field: Field;
}
export function RenderSitecoreField({
  field,
}: RenderSitecoreFieldProps): ReactElement<React.FC> {
  const [showLinkToolTip, setShowLinlToolTip] = useState<boolean>(false);

  const imageSrc = field?.value?.["src"];
  if (imageSrc) {
    const alt = field?.value?.["alt"];
    return (
      <Image
        alt={alt}
        src={imageSrc}
        width={0}
        height={0}
        sizes="100vw"
        style={{ width: "20%", height: "auto" }}
      />
    );
  }

  const linkHref = field?.value?.["href"];
  if (linkHref) {
    // const linkType = field?.value?.["linktype"];
    const url = field?.value?.["url"];
    const target = field?.value?.["target"];
    const text = field?.value?.["text"];
    const title = field?.value?.["title"];

    return (
      <div className="relative w-full h-16">
        <button
          onMouseOver={() => setShowLinlToolTip(true)}
          onMouseOut={() => setShowLinlToolTip(false)}
          type="button"
          className="rounded bg-indigo-600 px-2 py-1 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        >
          {title ? title : text ? text : "No Link Text"}
        </button>
        <p
          className={`top-8 left-16 bg-gray-200 p-1 rounded-lg text-black ${
            showLinkToolTip ? "absolute" : "hidden"
          }`}
        >
          {linkHref ?? url ?? target}
        </p>
      </div>
    );
  }
  if (field.value as string) {
    const stringField = field.value as string;
    if (Object.keys(stringField).length == 0) {
      return <></>;
    }
    if (stringField.includes("div")) {
      return (
        <>
          <div
            dangerouslySetInnerHTML={{
              __html: JSON.stringify(stringField, null, 2),
            }}
          ></div>
        </>
      );
    }

    if (stringField.startsWith("http") || stringField.startsWith("https")) {
      return (
        <Image
          alt={"External Image"}
          src={stringField}
          width={0}
          height={0}
          sizes="100vw"
          style={{ width: "20%", height: "auto" }}
        />
      );
    }
    return <div>{stringField}</div>;
  } else if (field.value as boolean) {
    const booleanField = field.value as boolean;
    return <Checkbox checked={booleanField ?? false}></Checkbox>;
  } else if (field.value as number) {
    const numberField = field.value as string;
    return <div>{numberField}</div>;
  }

  return <div>{JSON.stringify(field.value, null, 2)}</div>;
}
