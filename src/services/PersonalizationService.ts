import { HIDDEN_RENDERING_NAME } from "@/consts/sitecore";
import {
  ComponentRendering,
  ComponentRenderingWithExperiences,
  EditMode,
  HtmlElementRendering,
  LayoutServiceData,
  PlaceholdersData,
} from "@/types/sitecore";

const transformToHiddenRenderingVariant = (
  component: ComponentRendering | HtmlElementRendering
) => ({
  ...component,
  componentName: HIDDEN_RENDERING_NAME,
  experiences: {},
});

export interface PersonalizedComparisonElement {
  element: ComponentRenderingWithExperiences;
  elementKey: string | undefined;
}

export interface PersonalizationComparison {
  original: PersonalizedComparisonElement;
  personalized: PersonalizedComparisonElement;
}

/**
 * Apply personalization to layout data. This will recursively go through all placeholders/components, check experiences nodes and replace default with object from specific experience.
 * @param {LayoutServiceData} layout Layout data
 * @param {string} variantId variant id
 * @param {string[]} [componentVariantIds] component variant ids
 */
export function personalizeLayout(
  layout: LayoutServiceData,
  variantId: string,
  componentsWithExperiences: ComponentRenderingWithExperiences[],
  personalizedComponents: PersonalizationComparison[],
  componentVariantIds?: string[]
): PlaceholdersData<string> | undefined {
  // Add (page-level) variantId to Sitecore context so that it is accessible here
  //   layout.sitecore.context.variantId = variantId;
  const placeholders = layout.sitecore.route?.placeholders || {};
  if (Object.keys(placeholders).length === 0) {
    return undefined;
  }
  const metadataEditing =
    layout.sitecore.context.pageEditing &&
    layout.sitecore.context.editMode === EditMode.Metadata;
  if (placeholders) {
    Object.keys(placeholders).forEach((placeholder) => {
      //   placeholders[placeholder] = personalizePlaceholder(
      //     placeholders[placeholder],
      //     [variantId, ...(componentVariantIds || [])],
      //     personalizedComponents,
      //     metadataEditing
      //   );
      personalizePlaceholder(
        placeholders[placeholder],
        [variantId, ...(componentVariantIds || [])],
        componentsWithExperiences,
        personalizedComponents,
        metadataEditing
      );
    });
  }
  return placeholders;
}

/**
 * @param {Array} components components within placeholder
 * @param {string[]} variantIds variant ids
 * @param {boolean} metadataEditing indicates if page is rendered in metadata edit mode
 * @returns {Array<ComponentRendering | HtmlElementRendering>} components with personalization applied
 */
export function personalizePlaceholder(
  components: Array<ComponentRendering | HtmlElementRendering>,
  variantIds: string[],
  componentsWithExperiences: ComponentRenderingWithExperiences[],
  personalizedComponents: PersonalizationComparison[],
  metadataEditing?: boolean
): Array<ComponentRendering | HtmlElementRendering> {
  return components
    .map((component) => {
      const rendering = component as ComponentRendering;

      if (
        (rendering as ComponentRenderingWithExperiences).experiences !==
        undefined
      ) {
        return personalizeComponent(
          rendering as ComponentRenderingWithExperiences,
          variantIds,
          componentsWithExperiences,
          personalizedComponents,
          metadataEditing
        ) as ComponentRendering | HtmlElementRendering;
      } else if (rendering.placeholders) {
        const placeholders = rendering.placeholders as PlaceholdersData;

        Object.keys(placeholders).forEach((placeholder) => {
          //   placeholders[placeholder] = personalizePlaceholder(
          //     placeholders[placeholder],
          //     variantIds,
          //     personalizedComponents,
          //     metadataEditing,
          //   );
          personalizePlaceholder(
            placeholders[placeholder],
            variantIds,
            componentsWithExperiences,
            personalizedComponents,
            metadataEditing
          );
        });
      }

      return component;
    })
    .filter(Boolean);
}

/**
 * @param {ComponentRenderingWithExperiences} component component with experiences
 * @param {string[]} variantIds variant ids
 * @param {boolean} metadataEditing indicates if page is rendered in metadata edit mode
 * @returns {ComponentRendering | null} component with personalization applied or null if hidden
 */
export function personalizeComponent(
  component: ComponentRenderingWithExperiences,
  variantIds: string[],
  componentsWithExperiences: ComponentRenderingWithExperiences[],
  personalizedComponents: PersonalizationComparison[],
  metadataEditing?: boolean
): ComponentRendering | null {
  if (component?.experiences) {
    componentsWithExperiences.push(component);
  }
  // Check if we have a page/component experience matching any of the variants (there should be at most 1)
  const match = Object.keys(component.experiences).find((variantId) =>
    variantIds.includes(variantId)
  );
  const variant = match && component.experiences[match];

  // variant and componentName can be undefined or null
  if (!variant && !component.componentName) {
    // DEFAULT IS HIDDEN
    if (metadataEditing) {
      component = transformToHiddenRenderingVariant(component);
    } else {
      return null;
    }
  } else if (
    variant &&
    variant.componentName === null &&
    variant.dataSource === null
  ) {
    // VARIANT IS HIDDEN
    if (metadataEditing) {
      const variant = transformToHiddenRenderingVariant(component);
      personalizedComponents.push({
        original: {
          element: component,
          elementKey: undefined,
        } as PersonalizedComparisonElement,
        personalized: {
          element: variant,
          elementKey: match,
        } as PersonalizedComparisonElement,
      });
      component = variant;
    } else {
      personalizedComponents.push({
        original: {
          element: component,
          elementKey: undefined,
        } as PersonalizedComparisonElement,
        personalized: {
          element: variant,
          elementKey: match,
        } as PersonalizedComparisonElement,
      });
      return null;
    }
  } else if (variant) {
    component = variant;
    personalizedComponents.push({
      original: {
        element: component,
        elementKey: undefined,
      } as PersonalizedComparisonElement,
      personalized: {
        element: variant,
        elementKey: match,
      } as PersonalizedComparisonElement,
    });
  }

  // remove unused experiences from layout data
  if (component.experiences) {
    // component.experiences = {};
  }

  if (!component.placeholders) return component;

  Object.keys(component?.placeholders).forEach((placeholder) => {
    if (component.placeholders) {
      component.placeholders[placeholder] = personalizePlaceholder(
        component.placeholders[placeholder],
        variantIds,
        componentsWithExperiences,
        personalizedComponents
      );
    }
  });

  return component;
}
