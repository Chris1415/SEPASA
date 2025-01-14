import Image from "next/image";
import Link from "next/link";

export default async function Home() {
  return (
    <div>
      <div className="my-8 relative">
        <Image
          src={"/Home_Hero.webp"}
          alt={"Hero Image"}
          width={0}
          height={0}
          objectFit="cover"
          sizes="100vw"
          style={{ width: "100%", height: "100%" }}
        />
        <div className="absolute top-12 left-7 bg-gray-700/80 rounded-3xl w-1/3 p-6">
          <h2 className="font-bold text-5xl italic"> Welcome SEPASA </h2>
          <p className="pt-6 text-2xl font-bold text-justify">
            This is a personal project to test embedded personalization for
            Sitecore XM Cloud. The main goals of this projects are to get a
            better understanding how exactly personalization works and of course
            to test existing personalizations. Just go to the Testing page to
            get started immediatly
          </p>
          <Link
            href={"/Simulator"}
            className="rounded-full mt-3 inline-block p-2 mx-auto w-full text-center bg-indigo-600 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            Simulate now
          </Link>
        </div>
      </div>
      {/* <div className="w-full h-auto ml-[35%] mr-auto">
        <Image
          alt="Personalization overview"
          src={
            "https://resources.doc.sitecore.com/assets/image/uuid-4838e944-b465-7f12-95e5-b89175bbdf57.png"
          }
          width={0}
          height={0}
          sizes="100vw"
          style={{ width: "30%", height: "auto" }}
        />
        <a
          className="text-gray-300"
          href={
            "https://doc.sitecore.com/xmc/en/developers/jss/22/jss-xmc/page-personalization-and-component-a-b-n-testing.html"
          }
        >
          Official Sitecore Documentation Reference
        </a>
      </div> */}
    </div>
  );
}
