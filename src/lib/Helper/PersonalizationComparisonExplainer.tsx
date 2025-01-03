import { PersonalizationComparison } from "@/services/PersonalizationService";
import {
  ComponentRenderingWithExperiences,
  Field,
  GenericFieldValue,
} from "@/types/sitecore";
import { ChevronDoubleRightIcon } from "@heroicons/react/24/outline";
import React, { ReactElement } from "react";

interface PersonalizationComparisonExplainerProps {
  element: PersonalizationComparison;
}

enum PersonalizationType {
  Unknown,
  Hide,
  ReplaceDatasource,
  ReplaceRendering,
}

export function PersonalizationComparisonExplainer({
  element,
}: PersonalizationComparisonExplainerProps): ReactElement<React.FC> {
  function DeterminePersonalizationType(
    originalElement: ComponentRenderingWithExperiences,
    personalizedElement: ComponentRenderingWithExperiences
  ): PersonalizationType {
    let currentPersonalizationType: PersonalizationType =
      PersonalizationType.Unknown;
    if (!personalizedElement.dataSource) {
      currentPersonalizationType = PersonalizationType.Hide;
    } else if (
      personalizedElement.componentName != originalElement.componentName
    ) {
      currentPersonalizationType = PersonalizationType.ReplaceRendering;
    } else if (personalizedElement.dataSource != originalElement.dataSource) {
      currentPersonalizationType = PersonalizationType.ReplaceDatasource;
    }
    return currentPersonalizationType;
  }

  function PersonalizationTypeExplanation(
    currentPersonalizationType: PersonalizationType
  ): ReactElement<React.FC> {
    return (
      <>
        <li>
          Ths original rendering was{" "}
          {currentPersonalizationType == PersonalizationType.Hide ? (
            <>
              <b>
                <i>hidden</i>
              </b>
            </>
          ) : currentPersonalizationType ==
            PersonalizationType.ReplaceDatasource ? (
            <>
              <b>
                <i>replaced </i>
              </b>
              by another datasource of the same rendering type{" "}
            </>
          ) : (
            <>
              <b>
                <i>replaced </i>
              </b>
              by another datasource of a another rendering type{" "}
            </>
          )}
        </li>
      </>
    );
  }

  function RenderingExchangeExplainer(
    originalElement: ComponentRenderingWithExperiences,
    personalizedElement: ComponentRenderingWithExperiences,
    personalizationType: PersonalizationType
  ): ReactElement<React.FC> {
    return (
      <>
        {personalizationType == PersonalizationType.ReplaceRendering ? (
          <li>
            The old rendering is {originalElement.componentName} and the new one
            is {personalizedElement.componentName}
          </li>
        ) : (
          <></>
        )}
      </>
    );
  }

  function DatasourceExchangeExplainer(
    originalElement: ComponentRenderingWithExperiences,
    personalizedElement: ComponentRenderingWithExperiences,
    personalizationType: PersonalizationType
  ): ReactElement<React.FC> {
    return (
      <>
        {personalizationType == PersonalizationType.ReplaceDatasource ? (
          <li>
            The old datasource is{" "}
            <b>
              <i>{originalElement.dataSource}</i>
            </b>{" "}
            and the new one is{" "}
            <b>
              <i>{personalizedElement.dataSource}</i>
            </b>
          </li>
        ) : (
          <></>
        )}
      </>
    );
  }

  interface FieldLevelComparison {
    old: string;
    new: string;
    keyVal: string;
  }

  function DetermineFieldChanges(
    originalElement: ComponentRenderingWithExperiences,
    personalizedElement: ComponentRenderingWithExperiences
  ) {
    const fieldLevelChanges: FieldLevelComparison[] = [];
    Object.keys(originalElement?.fields ?? []).map((element) => {
      // Add support for other types like item and item[] as well
      const originalValue = originalElement?.fields?.[
        element
      ] as Field<GenericFieldValue>;
      const personalizedValue = personalizedElement?.fields?.[
        element
      ] as Field<GenericFieldValue>;
      const newFieldVal = JSON.stringify(personalizedValue?.value, null, 2);
      const oldFieldVal = JSON.stringify(originalValue?.value, null, 2);
      if (oldFieldVal != newFieldVal) {
        fieldLevelChanges.push({
          new: newFieldVal,
          old: oldFieldVal,
          keyVal: element,
        } as FieldLevelComparison);
      }
    });
    return fieldLevelChanges;
  }

  function FieldDifferenceExplainer(
    originalElement: ComponentRenderingWithExperiences,
    personalizedElement: ComponentRenderingWithExperiences,
    personalizationType: PersonalizationType
  ): ReactElement<React.FC> {
    const fieldLevelChanges = DetermineFieldChanges(
      originalElement,
      personalizedElement
    );
    return (
      <>
        {personalizationType == PersonalizationType.ReplaceDatasource ? (
          <>
            <li>The following field values are different </li>
            <div className="grid grid-cols-12 pt-4">
              {fieldLevelChanges.map((element) => {
                return (
                  <>
                    <div className="col-span-1 overflow-hidden p-2 m-2">
                      {element.keyVal}
                    </div>
                    <div className="col-span-5 overflow-hidden p-2 m-2 border-2 border-dotted border-gray-500">
                      {element.old}
                    </div>
                    <div className="col-span-1 p-2 text-center">
                      <ChevronDoubleRightIcon className="text-gray-400 size-8 inline-block" />
                    </div>
                    <div className="col-span-5 overflow-hidden p-2 m-2 border-2 border-dotted border-gray-500">
                      {element.new}
                    </div>
                  </>
                );
              })}
            </div>
          </>
        ) : (
          <></>
        )}
      </>
    );
  }

  const originalElement = element.original.element;
  const personalizedElement = element.personalized.element;
  const personalizationType = DeterminePersonalizationType(
    originalElement,
    personalizedElement
  );

  return (
    <>
      <div></div>
      <ul className="list-disc pl-2">
        {PersonalizationTypeExplanation(personalizationType)}
        {RenderingExchangeExplainer(
          originalElement,
          personalizedElement,
          personalizationType
        )}
        {DatasourceExchangeExplainer(
          originalElement,
          personalizedElement,
          personalizationType
        )}
        {FieldDifferenceExplainer(
          originalElement,
          personalizedElement,
          personalizationType
        )}
      </ul>
    </>
  );
}
