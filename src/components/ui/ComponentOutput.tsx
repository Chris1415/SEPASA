import { RenderSitecoreField } from "@/lib/Helper/RenderField";
import { ComponentRenderingWithExperiences, Field } from "@/types/sitecore";
import { DocumentTextIcon, EyeIcon } from "@heroicons/react/24/outline";
import { useState } from "react";

interface ComponentOutputProps {
  component: ComponentRenderingWithExperiences;
  variantId?: string;
}

export function ComponentOutput({
  component,
  variantId,
}: ComponentOutputProps) {
  const [rawView, setRawView] = useState<boolean>(true);
  return (
    <>
      <div className="border-gray-400 border-2 border-dotted my-4 p-4 bg-gray-950 inline-block w-full">
        <h3 className="text-lg font-semibold text-white inline-block">
          {component?.componentName ?? "No component"}
        </h3>
        {rawView ? (
          <EyeIcon
            className="size-8 pb-1 mx-2 float-end inline-block"
            onClick={() => setRawView(false)}
          />
        ) : (
          <DocumentTextIcon
            className="size-8 pb-1 mx-2 float-end inline-block"
            onClick={() => setRawView(true)}
          />
        )}
        <span
          className={`inline-block float-end rounded-md ${
            !variantId ? "bg-green-300" : "bg-red-300"
          } px-1.5 py-0.5 text-md font-medium text-gray-700`}
        >
          {variantId ? variantId : "Original"}
        </span>

        <div className="mt-4 border-t border-white/10">
          <dl className="divide-y divide-white/10">
            <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
              <dt className="text-sm/6 font-medium text-white">Datasource</dt>
              <dd className="mt-1 text-sm/6 text-gray-400 sm:col-span-2 sm:mt-0">
                {component?.dataSource ?? "The component will be hidden"}
              </dd>
            </div>
            {Object.keys(component?.fields ?? []).map((element) => {
              if (component?.fields) {
                const field = component?.fields[element] as Field;
                return (
                  <div key={element} className="">
                    <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                      <dt className="text-sm/6 font-medium text-white">
                        {element}
                      </dt>

                      <dd className="mt-1 text-sm/6 overflow-hidden text-gray-400 sm:col-span-2 sm:mt-0">
                        {!rawView ? (
                          <RenderSitecoreField field={field} fieldKey={element} />
                        ) : (
                          JSON.stringify(field.value, null, 2)
                        )}
                      </dd>
                    </div>
                  </div>
                );
              }
            })}
          </dl>
        </div>
      </div>
    </>
  );
}
