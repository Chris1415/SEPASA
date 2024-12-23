"use client";
import { CloudSDK } from "@sitecore-cloudsdk/core/browser";
import "@sitecore-cloudsdk/personalize/browser";
import "@sitecore-cloudsdk/events/browser";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  ExperienceParams,
  LayoutServiceData,
  Route,
  SiteInfo,
} from "@/types/sitecore";
import {
  executePersonalize,
  GetFlowDefinition,
  GetPersonalizationInfo,
  getPersonalizeExecutions,
} from "@/services/GraphQlPersonalizeService";
import {
  fetchLayoutData,
  fetchSiteInfos,
  fetchSiteRoutes,
} from "@/services/GraphQlXmcService";
import { COUNTIRES, LANGUAGES } from "@/consts/sitecore";
import {
  PersonalizationComparison,
  personalizeLayout,
} from "@/services/PersonalizationService";
import { pageView } from "@sitecore-cloudsdk/events/browser";
import { getGuestId } from "@sitecore-cloudsdk/core/browser";
import { deleteCookie, getCookie } from "cookies-next";
import SelectMenu, { SelectMenuItem } from "../ui/SelectMenu";
import CheckboxList, { CheckboxItem } from "../ui/CheckboxList";
// import { getGuestId, getBrowserId } from "@sitecore-cloudsdk/core/browser";

export default function PersonalizationTester() {
  const query = useSearchParams();
  const [allVariants, setAllVariants] = useState<string[] | null>();
  const [chosenVariant, setChosenVariant] = useState<string[] | null>();
  const [layoutData, setLayoutData] = useState<LayoutServiceData>();
  //   const [personalizedLayoutData, setPersonalizedLayoutData] =
  //     useState<LayoutServiceData>();
  const [personalizedComponents, setPersonalizedComponents] =
    useState<PersonalizationComparison[]>();
  const [siteName, setSiteName] = useState<string>("");
  const [allSites, setAllSites] = useState<SiteInfo[]>();
  const [allRoutes, setAllRoutes] = useState<Route[]>();
  const [path, setPath] = useState<string>("/");
  const [language, setLanguage] = useState<string>("en");
  const [country, setCountry] = useState<string>("");
  const [pathForEvent, setPathForEvent] = useState<string>("");
  const [guesId, setGuesId] = useState<string>();
  const [utmParams, setUtmParams] = useState<string[]>([]);
  const [readMore, setReadMore] = useState<boolean>();

  function AddPathToViewEvents() {
    pageView({
      channel: "WEB",
      currency: "USD",
      page: pathForEvent,
      language,
      includeUTMParameters: true,
    });
  }

  async function ResetGuestId() {
    deleteCookie("sc_5Q0eCEiytH8KmmQtcmiRUG_personalize");
    deleteCookie("sc_5Q0eCEiytH8KmmQtcmiRUG");

    CloudSDK({
      sitecoreEdgeContextId: process.env.NEXT_PUBLIC_CONTEXTID ?? "",
      siteName: siteName,
      enableBrowserCookie: true,
    })
      .addPersonalize({
        enablePersonalizeCookie: true,
        webPersonalization: true,
      })
      .addEvents()
      .initialize();

    setTimeout(async () => {
      const newGuestId = await getCookie(
        "sc_5Q0eCEiytH8KmmQtcmiRUG_personalize"
      );
      if (newGuestId) {
        setGuesId(newGuestId);
      }
    }, 1000);
  }

  useEffect(() => {
    async function GetSites() {
      const sites = await fetchSiteInfos();
      setAllSites(sites);
    }

    GetSites();
  }, []);

  useEffect(() => {
    async function GetRoutes() {
      const routes = await fetchSiteRoutes(siteName);
      setAllRoutes(routes);
    }

    GetRoutes();
  }, [siteName]);

  useEffect(() => {
    const utm = {
      campaign: utmParams.includes("utm_campaign") || undefined,
      content: utmParams.includes("utm_content") || undefined,
      medium: utmParams.includes("utm_medium") || undefined,
      source: utmParams.includes("utm_source") || undefined,
    };

    // Cloud SDK Initialization
    if (siteName) {
      CloudSDK({
        sitecoreEdgeContextId: process.env.NEXT_PUBLIC_CONTEXTID ?? "",
        siteName: siteName,
        enableBrowserCookie: true,
      })
        .addPersonalize({
          enablePersonalizeCookie: true,
          webPersonalization: true,
        })
        .addEvents()
        .initialize();
      // *****

      async function SetGuesId() {
        setGuesId(await getGuestId());
      }

      SetGuesId();

      console.log(siteName + "|" + path + "|" + language);
      // ASYNC PART ****** //
      async function Personalize() {
        // Grab the informatuion if variants exist and which ones
        const personalizeInfo = await GetPersonalizationInfo(
          siteName,
          path,
          language
        );
        console.log(
          "personalizeInfo: " + JSON.stringify(personalizeInfo, null, 2)
        );

        // Transform the data to a format Personalize understands
        const personalizationExecutions = await getPersonalizeExecutions(
          personalizeInfo,
          language
        );
        console.log(
          "personalizationExecutions: " +
            JSON.stringify(personalizationExecutions, null, 2)
        );

        setAllVariants(personalizationExecutions?.at(0)?.variantIds);

        // Get additional Information about the flow definition (Currently not working)
        const flowDefinition = await GetFlowDefinition(
          personalizationExecutions?.at(0)?.friendlyId
        );
        console.log(
          "flowDefinition: " + JSON.stringify(flowDefinition, null, 2)
        );

        // Identify which variant/audience should be applied as personalization
        const identifiedVariantIds: string[] = [];
        await Promise.all(
          personalizationExecutions.map((execution) =>
            executePersonalize({
              params: { utm: utm, referrer: "" } as ExperienceParams,
              friendlyId: execution.friendlyId,
              variantIds: execution.variantIds,
              language,
              country,
            }).then((personalization) => {
              console.log(
                "executePersonalizeResult: " +
                  JSON.stringify(personalization, null, 2)
              );
              const variantId = personalization.variantId;
              if (variantId) {
                if (!execution.variantIds.includes(variantId)) {
                } else {
                  identifiedVariantIds.push(variantId);
                }
              }
            })
          )
        );

        console.log("identifiedVariantIds: " + identifiedVariantIds);
        if (identifiedVariantIds.length > 0) {
          setChosenVariant(identifiedVariantIds);
        } else {
          setChosenVariant(undefined);
        }

        // Get Standard Layout Response
        const layoutData = await fetchLayoutData(siteName, path, language);
        console.log(JSON.stringify(layoutData, null, 2));
        if (layoutData) {
          setLayoutData(layoutData);
        }

        if (identifiedVariantIds.length > 0) {
          const personalizedComponents: PersonalizationComparison[] = [];
          personalizeLayout(
            layoutData,
            identifiedVariantIds?.at(0) ?? "",
            personalizedComponents,
            []
          );
          // setPersonalizedLayoutData(layoutData);
          setPersonalizedComponents(personalizedComponents);
        } else {
          // setPersonalizedLayoutData(undefined);
          setPersonalizedComponents(undefined);
        }
      }

      Personalize();
    }
  }, [language, path, query, siteName, country, utmParams]);

  return (
    <>
      <div>
        <h2 className="text-1xl font-bold pt-8">Input</h2>
        <div>
          <div className="grid grid-cols-3">
            <div className="py-2 pr-2">
              <SelectMenu
                headline="Select Site"
                items={allSites?.map((element) => {
                  return {
                    key: element.name,
                    label: element.name,
                  } as SelectMenuItem;
                })}
                chosenValue={siteName}
                setChosenValue={setSiteName}
              />
            </div>
            <div className="py-2 pr-2">
              <SelectMenu
                headline="Select Language"
                items={LANGUAGES?.map((element) => {
                  return {
                    key: element.key,
                    label: element.val,
                  } as SelectMenuItem;
                })}
                chosenValue={language}
                setChosenValue={setLanguage}
              />
            </div>
            <div className="py-2 pr-2">
              <SelectMenu
                headline="Select Route"
                items={allRoutes?.map((element) => {
                  return {
                    key: element.routePath,
                    label: element.routePath + " (" + element.route.name + ")",
                  } as SelectMenuItem;
                })}
                chosenValue={path}
                setChosenValue={setPath}
              />
            </div>
          </div>
          <hr />
          <div className="grid grid-cols-3">
            <div className="py-2 pr-2">
              <SelectMenu
                headline="Select Country"
                items={COUNTIRES?.map((element) => {
                  return {
                    key: element.key,
                    label: element.val,
                  } as SelectMenuItem;
                })}
                chosenValue={country}
                setChosenValue={setCountry}
              />
            </div>
            <div className="py-2 pr-2">
              <SelectMenu
                headline="Add path to journey"
                items={allRoutes?.map((element) => {
                  return {
                    key: element.route.name,
                    label: element.route.name,
                  } as SelectMenuItem;
                })}
                chosenValue={pathForEvent}
                setChosenValue={setPathForEvent}
              />
              <button
                onClick={() => AddPathToViewEvents()}
                type="button"
                className="rounded bg-indigo-600 px-4 mx-2 mt-2 py-1 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
              >
                Add
              </button>
              <button
                onClick={() => ResetGuestId()}
                type="button"
                className="rounded bg-indigo-600 px-2 py-1 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
              >
                Reset Guest ID
              </button>
            </div>
            <div className="pt-3 pl-4">
              <CheckboxList
                items={[
                  {
                    key: "utm_campaign",
                    label: "Campaign",
                    description: "",
                  } as CheckboxItem,
                  {
                    key: "utm_content",
                    label: "Content",
                    description: "",
                  } as CheckboxItem,
                  {
                    key: "utm_medium",
                    label: "Medium",
                    description: "",
                  } as CheckboxItem,
                  {
                    key: "utm_source",
                    label: "Source",
                    description: "",
                  } as CheckboxItem,
                ]}
                headline="Choose UTM Parameter"
                chosenValues={utmParams}
                setChosenValues={setUtmParams}
              />
            </div>
          </div>
        </div>
        <div></div>
      </div>

      <hr />

      <div>
        <div className="grid grid-cols-6">
          <div>
            <h2 className="text-1xl font-bold pt-8">Current Site</h2>
            {siteName == null ? "No site active" : siteName}
          </div>
          <div>
            <h2 className="text-1xl font-bold pt-8"> Current Path </h2>
            {path == null ? "No path active" : path}
          </div>
          <div>
            <h2 className="text-1xl font-bold pt-8"> Current Language </h2>
            {language == null ? "No language active" : language}
          </div>
          <div>
            <h2 className="text-1xl font-bold pt-8"> Current Country</h2>
            {country == null ? "No country active" : country}
          </div>
          <div>
            <h2 className="text-1xl font-bold pt-8">CDP / P Guest ID </h2>
            {guesId}
          </div>
          <div>
            <h2 className="text-1xl font-bold pt-8">UTM Params</h2>
            {utmParams.join("|")}
          </div>
        </div>
      </div>

      <hr />

      <div>
        <h2 className="text-1xl font-bold pt-8">
          Available Variants({allVariants?.length}){" "}
        </h2>

        {allVariants == null ? "(No variants found)" : allVariants.join(" | ")}
      </div>

      <div>
        <h2 className="text-1xl font-bold pt-8"> Active Variant is: </h2>

        {chosenVariant == null ? "(No active variant found)" : chosenVariant}
      </div>

      <hr />

      <div>
        <h2 className="text-1xl font-bold pt-8">
          Standard Layout Response is:
        </h2>
        <div className={readMore ? "" : "line-clamp-3"}>
          {layoutData == null
            ? "... no data for " + path
            : JSON.stringify(layoutData, null, 2)}
        </div>
        <button
          onClick={() => setReadMore(!readMore)}
          type="button"
          className="rounded m-2 mx-auto w-full bg-indigo-600 px-2 py-1 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        >
          {readMore ? "Read less" : "Read more"}
        </button>
      </div>

      <div>
        <h2 className="text-1xl font-bold pt-8">
          Personalized Layout Response:
        </h2>
        There is currently an issue replacing the real content with personalize
        one
        {/* <div>
          {personalizedLayoutData == null
            ? "... no data for " + path
            : JSON.stringify(personalizedLayoutData, null, 2)}
        </div> */}
      </div>
      <div>
        <h2 className="text-1xl font-bold pt-8">
          Personalized Components comparison
        </h2>
        <div>
          {personalizedComponents == null ? (
            <>... no data for {path}</>
          ) : (
            <div className="grid grid-cols-2">
              <div>
                <div>
                  <h3 className="text-1xl font-bold pt-8 text-center">
                    Original Content
                  </h3>
                </div>
              </div>
              <div>
                <div>
                  <h3 className="text-1xl font-bold pt-8 text-center">
                    Personalized Content{" "}
                  </h3>
                </div>
              </div>
              {personalizedComponents.map((element) => {
                return (
                  <>
                    <div className="border border-black p-4 m-2">
                      {JSON.stringify(element.original, null, 2)}
                    </div>
                    <div className="border border-black p-4 m-2">
                      {JSON.stringify(element.personalized, null, 2)}
                    </div>
                  </>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
