import { GRAPHQL_LAYOUT_QUERY_NAME } from "@/consts/sitecore";
import client from "@/lib/Apollo/client";
import { LayoutServiceData, Route, SiteInfo } from "@/types/sitecore";
import { DocumentNode, gql } from "@apollo/client";

export async function fetchSiteRoutes(siteName: string): Promise<Route[]> {
  const query = gql
  `query {
      site {
         siteInfo(site:"${siteName}") { 
          name
          language
          rootPath
          sitemap
          routes(language: "en", excludedPaths: "/Error-Pages", first: 20) {
            results {
              routePath
              route {
                name
                displayName
              }
            }
          }
        }
      }
    }
  `;

  const data = await client.query<{
    site: { siteInfo: SiteInfo };
  }>({
    query: query,
  });

  return data?.data?.site?.siteInfo?.routes?.results;
}

export async function fetchSiteInfos(): Promise<SiteInfo[]> {
  const query = gql`
    query {
      site {
        siteInfoCollection {
          name
          language
          rootPath
        }
      }
    }
  `;

  const data = await client.query<{
    site: { siteInfoCollection: SiteInfo[] };
  }>({
    query: query,
  });

  return data?.data?.site?.siteInfoCollection;
}

export async function fetchLayoutData(
  siteName: string,
  itemPath: string,
  language?: string
): Promise<LayoutServiceData> {
  const query = getLayoutQuery(siteName, itemPath, language);

  const data = await client.query<{
    layout: { item: { rendered: LayoutServiceData } };
  }>({
    query: query,
  });

  // If `rendered` is empty -> not found
  return (
    data?.data?.layout?.item?.rendered || {
      sitecore: { context: { pageEditing: false, language }, route: null },
    }
  );
}

function getLayoutQuery(
  siteName: string,
  itemPath: string,
  language?: string
): DocumentNode {
  const languageVariable = language ? `, language:"${language}"` : "";

  const layoutQuery = `layout(site:"${siteName}", routePath:"${itemPath}"${languageVariable})`;

  return gql`query ${GRAPHQL_LAYOUT_QUERY_NAME} {
      ${layoutQuery}{
        item {
          rendered
        }
      }
    }`;
}
