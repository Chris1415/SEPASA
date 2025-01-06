"use client";
import { CloudSDK } from "@sitecore-cloudsdk/core/browser";
import "@sitecore-cloudsdk/personalize/browser";
import "@sitecore-cloudsdk/events/browser";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  ComponentRenderingWithExperiences,
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
import { deleteCookie, getCookie, setCookie } from "cookies-next";
import SelectMenu, { SelectMenuItem } from "../ui/SelectMenu";
import CheckboxList, { CheckboxItem } from "../ui/CheckboxList";
import { ComponentOutput } from "../ui/ComponentOutput";
import { ChevronDoubleRightIcon } from "@heroicons/react/24/outline";
import { PersonalizationComparisonExplainer } from "@/lib/Helper/PersonalizationComparisonExplainer";

export default function PersonalizationSimulator() {
  const query = useSearchParams();
  const [allVariants, setAllVariants] = useState<string[] | null>();
  const [chosenVariant, setChosenVariant] = useState<string[] | null>();
  const [layoutData, setLayoutData] = useState<LayoutServiceData>();
  const [personalizedComponents, setPersonalizedComponents] =
    useState<PersonalizationComparison[]>();
  const [siteName, setSiteName] = useState<string>("");
  const [allSites, setAllSites] = useState<SiteInfo[]>();
  const [allRoutes, setAllRoutes] = useState<Route[]>();
  const [path, setPath] = useState<string>("/");
  const [language, setLanguage] = useState<string>("en");
  const [country, setCountry] = useState<string>("");
  const [pathForEvent, setPathForEvent] = useState<string>("");
  const [guestId, setGuesId] = useState<string>();
  const [utmParams, setUtmParams] = useState<string[]>([]);
  const [readMore, setReadMore] = useState<boolean>(false);
  const [componentsWithExperiences, setComponentsWithExperiences] =
    useState<ComponentRenderingWithExperiences[]>();
  const [cardBasedPersonalizedOutput, setCardBasedPersonalizedOutput] =
    useState<boolean>(false);
  const [referrer, setReferrer] = useState<string>();
  const [chosenReferrer, setChosenReferrer] = useState<string>();
  const [showAllExperiences, setShowAllExperiences] = useState<boolean>(false);
  const [journeyPathes, setJourneyPathes] = useState<string[]>([]);

  async function AddPathToViewEvents() {
    pageView({
      channel: "WEB",
      currency: "USD",
      page: pathForEvent,
      language,
      includeUTMParameters: true,
      referrer: chosenReferrer,
      //requested_at is missing for Date and Datetime ???
    });

    const currentPathes = journeyPathes;
    currentPathes.push(pathForEvent);
    setJourneyPathes([...currentPathes]);

    if (guestId) {
      setCookie(guestId + "_journey", currentPathes.join("|"));
    }
  }

  async function ResetGuestId() {
    const cookieName = "sc_5Q0eCEiytH8KmmQtcmiRUG";
    deleteCookie(cookieName + "_personalize");
    deleteCookie(cookieName);
    setJourneyPathes([]);
    setCookie(guestId + "_journey", []);

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
      const newGuestId = await getCookie(cookieName);
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
    async function SetJourneysFromCookies() {
      const existingJourneySession = await getCookie(guestId + "_journey");
      if (existingJourneySession) {
        setJourneyPathes(existingJourneySession?.split("|"));
      }
    }

    SetJourneysFromCookies();
  }, [guestId]);

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
        const guestId = await getGuestId();
        setGuesId(guestId);
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
              params: {
                utm: utm,
                referrer: chosenReferrer,
              } as ExperienceParams,
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

        // if (identifiedVariantIds.length > 0) {
        const personalizedComponents: PersonalizationComparison[] = [];
        const componentsWithExperiences: ComponentRenderingWithExperiences[] =
          [];
        personalizeLayout(
          layoutData,
          identifiedVariantIds?.at(0) ?? "",
          componentsWithExperiences,
          personalizedComponents,
          []
        );
        setComponentsWithExperiences(componentsWithExperiences);

        if (personalizedComponents.length == 0) {
          setPersonalizedComponents(undefined);
        } else {
          setPersonalizedComponents(personalizedComponents);
        }

        // } else {
        //   // setPersonalizedLayoutData(undefined);
        //   setPersonalizedComponents(undefined);
        // }
      }

      Personalize();
    }
  }, [
    language,
    path,
    query,
    siteName,
    country,
    utmParams,
    chosenReferrer,
    journeyPathes,
  ]);

  return (
    <>
      <div>
        <h2 className="text-2xl italic font-bold pt-4">Routing Input</h2>
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
                    label: element.routePath,
                  } as SelectMenuItem;
                })}
                chosenValue={path}
                setChosenValue={setPath}
              />
            </div>
          </div>
          <hr className="mt-4" />
          <h2 className="text-2xl italic font-bold pt-4">Simulation Input</h2>
          <div className="grid grid-cols-2">
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
                className="rounded bg-indigo-600 px-4 mr-2 mt-2 py-1 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
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
            <div className="pt-3">
              <label
                htmlFor="referrer"
                className="block text-sm/6 font-medium text-gray-300"
              >
                Referrer
              </label>
              <div className="mt-1">
                <input
                  id="referrer"
                  name="referrer"
                  type="text"
                  value={referrer}
                  onChange={(e) => setReferrer(e.target.value)}
                  placeholder="Please add an absoulte URL as referrer"
                  className="block w-full rounded-md bg-gray-900 px-3 py-1 text-base text-gray-300 outline outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                />
              </div>
              <button
                className="rounded bg-indigo-600 px-4 mr-2 mt-2 py-1 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                onClick={() => setChosenReferrer(referrer)}
              >
                Set
              </button>
            </div>
          </div>
        </div>
      </div>

      <hr />

      <div className="w-full">
        <h2 className="text-2xl italic font-bold pb-2"> Parameter Overview</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-3">
          <div>
            <h2 className="text-xl italic font-bold pt-4">Current Site</h2>
            <div className="text-gray-400 bg-indigo-800 inline-block px-1.5 text-sm py-1 mt-1 rounded-md mr-1">
              {siteName == null ? "No site active" : siteName}
            </div>
          </div>
          <div>
            <h2 className="text-1xl italic font-bold pt-4"> Current Path </h2>

            <div className="text-gray-400 bg-indigo-800 inline-block px-1.5 text-sm py-1 mt-1 rounded-md mr-1">
              {path == null ? "No path active" : path}
            </div>
          </div>
          <div>
            <h2 className="text-1xl font-bold pt-4"> Current Language </h2>

            <div className="text-gray-400 bg-indigo-800 inline-block px-1.5 text-sm py-1 mt-1 rounded-md mr-1">
              {language == null ? "No language active" : language}
            </div>
          </div>
          <div>
            <h2 className="text-1xl font-bold pt-4"> Current Country</h2>

            <div className="text-gray-400 bg-indigo-800 inline-block px-1.5 text-sm py-1 mt-1 rounded-md mr-1">
              {language == null ? "No language active" : country}
            </div>
          </div>
          <div>
            <h2 className="text-1xl font-bold pt-4">CDP / P Guest ID </h2>

            <div className="text-gray-400 bg-indigo-800 inline-block px-1.5 text-sm py-1 mt-1 rounded-md mr-1">
              {guestId}
            </div>
          </div>
          <div>
            <h2 className="text-1xl font-bold pt-4">UTM Params</h2>

            {utmParams &&
              utmParams.map((element, key) => {
                return (
                  <div
                    key={key}
                    className="text-gray-400 bg-indigo-800 inline-block px-1.5 text-sm py-1 mt-1 rounded-md mr-1"
                  >
                    {element}
                  </div>
                );
              })}
          </div>
          <div>
            <h2 className="text-1xl font-bold pt-4">Referrer </h2>
            <div className="text-gray-400 bg-indigo-800 inline-block px-1.5 text-sm py-1 mt-1 rounded-md mr-1">
              {chosenReferrer}
            </div>
          </div>
          <div>
            <h2 className="text-1xl font-bold pt-4">Journey Pathes</h2>
            <div className="text-gray-400">
              {journeyPathes &&
                journeyPathes.map((element, key) => {
                  return (
                    <div
                      className="bg-indigo-800 inline-block px-1.5 text-sm py-1 mt-1 rounded-md mr-1"
                      key={key}
                    >
                      {element}
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      </div>

      <hr />

      <div className="w-full">
        <h2 className="text-2xl italic font-bold pb-2">
          Available Variants ({allVariants?.length ?? 0})
        </h2>
        {allVariants == null ? (
          <div className={"bg-red-800 rounded-md inline-block py-1 px-2 mr-2"}>
            No available Variants found
          </div>
        ) : (
          <></>
        )}

        {allVariants?.map((element, key) => {
          return (
            <div
              key={key}
              className={
                " bg-indigo-800 rounded-md inline-block py-1 px-2 mr-2 mt-1"
              }
            >
              {element}
            </div>
          );
        })}
      </div>

      <div className="w-full">
        <h2 className="text-2xl italic font-bold pb-2">Active Variant is:</h2>
        <div
          className={
            (chosenVariant == null ? "bg-red-800" : "bg-green-800") +
            " rounded-md inline-block py-1 px-2"
          }
        >
          {chosenVariant == null
            ? allVariants == null
              ? "There is no variant available"
              : "No personalization applied"
            : chosenVariant}
        </div>
      </div>

      <hr />

      <div>
        <h2 className="text-2xl italic font-bold pb-2">
          Standard Layout Response is:
        </h2>
        <p className="text-gray-500 text-sm pb-2">Click to see full response</p>

        <div
          onClick={() => setReadMore(!readMore)}
          className={
            (readMore ? "" : "line-clamp-3 ") +
            (layoutData == null
              ? ""
              : "hover:border-purple-900 hover:shadow-sm cursor-pointer ") +
            "bg-gray-950 p-3 border-gray-400 border-2 border-dotted shadow-gray-500 shadow-md "
          }
        >
          <pre className={readMore ? "overflow-auto" : "line-clamp-6"}>
            {layoutData == null
              ? "No layout data for the following route (" + path + ")"
              : JSON.stringify(layoutData, null, 2)}
          </pre>
        </div>
        <div className="mt-8">
          <h2 className="text-2xl italic font-bold pb-2 inline-block">
            All components with experiences:
          </h2>
          <p className="text-gray-500 text-sm pb-2">
            Click to see all components
          </p>
          {(componentsWithExperiences?.length ?? 0) == 0 ? (
            <div
              className={
                " bg-gray-950 p-3 border-gray-400 border-2 border-dotted shadow-gray-500 shadow-md"
              }
            >
              There are no components with experiences on the page
            </div>
          ) : !showAllExperiences ? (
            <div
              className={
                " bg-gray-950  cursor-pointer p-3 border-gray-400 border-2 border-dotted shadow-gray-500 shadow-md hover:border-purple-900 hover:shadow-sm"
              }
              onClick={() => setShowAllExperiences(!showAllExperiences)}
            >
              Hidden components with experiences
            </div>
          ) : (
            <></>
          )}
          {showAllExperiences &&
            componentsWithExperiences?.map((element, key) => {
              return (
                <div
                  key={key}
                  className="cursor-pointer border-solid border-gray-300 border-2 mt-6 mb-12 p-2"
                >
                  <div
                    onClick={() => setShowAllExperiences(!showAllExperiences)}
                  >
                    <h2 className="text-2xl italic font-bold text-white pt-2">
                      Rendering: {element.uid}
                    </h2>
                    <p className="text-gray-500 text-sm pb-2">
                      Click to hide all components
                    </p>
                  </div>

                  <ComponentOutput component={element} />
                  {Object.keys(element.experiences).map(
                    (experienceKey, key) => {
                      return (
                        <ComponentOutput
                          key={key}
                          component={element.experiences[experienceKey]}
                          variantId={experienceKey}
                        />
                      );
                    }
                  )}
                </div>
              );
            })}
        </div>
      </div>
      <div className="mb-4">
        <h2 className="text-2xl italic font-bold pb-2 inline-block">
          {" "}
          Personalized Components comparison:
        </h2>
        {personalizedComponents != null ? (
          <button
            className="float-end inline-block mb-4 bg-indigo-600 py-1 px-2 rounded-lg hover:bg-indigo-800"
            onClick={() =>
              setCardBasedPersonalizedOutput(!cardBasedPersonalizedOutput)
            }
          >
            {cardBasedPersonalizedOutput ? "To Textual" : "To Card based"}
          </button>
        ) : (
          <></>
        )}

        {personalizedComponents == null ? (
          <div className="bg-gray-950 p-3 border-gray-400 border-2 border-dotted shadow-gray-500 shadow-md">
            No applied personalizations for the following path ({path})
          </div>
        ) : cardBasedPersonalizedOutput ? (
          <div className="grid grid-cols-7 mb-4 w-full">
            <div className="col-span-3">
              <h3 className="text-1xl font-bold pt-4 text-center">
                Original Content
              </h3>
            </div>
            <div></div>
            <div className="col-span-3">
              <h3 className="text-1xl font-bold pt-4 text-center">
                Personalized Content{" "}
              </h3>
            </div>

            {personalizedComponents.map((element) => {
              return (
                <>
                  <div className="mx-2 py-4 col-span-3 h-full">
                    {/* {JSON.stringify(element.original, null, 2)} */}
                    <ComponentOutput component={element.original.element} />
                  </div>
                  <div className="mx-2 py-4 h-full pt-[70%]">
                    <ChevronDoubleRightIcon className="text-gray-400 hover:text-purple-900" />
                  </div>
                  <div className=" mx-2 py-4 col-span-3 h-full">
                    <ComponentOutput
                      component={element.personalized.element}
                      variantId={element.personalized.elementKey}
                    />
                    {/* {JSON.stringify(element.personalized, null, 2)} */}
                  </div>
                </>
              );
            })}
          </div>
        ) : (
          <>
            {personalizedComponents.map((element) => {
              return (
                <>
                  <div className="col-span-7 p-4 my-2 bg-gray-950 border-gray-400 border-2 border-dotted shadow-gray-500 shadow-md hover:border-purple-900 hover:shadow-sm">
                    <PersonalizationComparisonExplainer element={element} />
                  </div>
                </>
              );
            })}
          </>
        )}
      </div>
    </>
  );
}
