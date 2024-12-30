import {
  ComponentRendering,
  ComponentRenderingWithExperiences,
  Field,
} from "@/types/sitecore";

interface DescriptionListProps {
  component: ComponentRenderingWithExperiences;
}

interface ComponentOutputProps {
  component: ComponentRendering;
  withLabels: boolean;
}

function ComponentOutput({ component, withLabels }: ComponentOutputProps) {
  return (
    <>
      <div>
        <h3 className="text-lg font-semibold text-white">
          {component?.componentName ?? "No component"}
        </h3>
        <div className="mt-4 border-t border-white/10">
          <dl className="divide-y divide-white/10">
            <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
              {withLabels ? (
                <dt className="text-sm/6 font-medium text-white">Datasource</dt>
              ) : (
                <></>
              )}

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
                      {withLabels ? (
                        <dt className="text-sm/6 font-medium text-white">
                          {element}
                        </dt>
                      ) : (
                        <></>
                      )}

                      <dd className="mt-1 text-sm/6 overflow-hidden text-gray-400 sm:col-span-2 sm:mt-0 line-clamp-1">
                        {JSON.stringify(field.value, null, 2)}
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

export default function DescriptionList({ component }: DescriptionListProps) {
  if (!component) {
    return <></>;
  }
  return (
    <div
      className={`grid grid-cols-${
        Object.keys(component?.experiences)?.length + 1
      }`}
    >
      <ComponentOutput component={component} withLabels={true} />
      {Object.keys(component?.experiences)?.map((element, key) => {
        const experience = component?.experiences[element];
        return (
          <div key={key} className="pl-6">
            <ComponentOutput component={experience} withLabels={false} />
          </div>
        );
      })}
    </div>
  );
}
