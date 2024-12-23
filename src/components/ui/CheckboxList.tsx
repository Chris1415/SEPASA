import { ChangeEvent, Dispatch, SetStateAction } from "react";

export interface CheckboxItem {
  key: string;
  label: string;
  description: string;
}

export interface CheckboxListProps {
  headline: string;
  items: CheckboxItem[];
  chosenValues: string[];
  setChosenValues: Dispatch<SetStateAction<string[]>>;
}

export default function CheckboxList({
  headline,
  items,
  chosenValues,
  setChosenValues,
}: CheckboxListProps) {
  function checkboxChecked(e: ChangeEvent<HTMLInputElement>) {
    const val = e.target.name;
    console.log(val);
    let currentCheckedValues = chosenValues;

    if (!currentCheckedValues) {
      currentCheckedValues = [];
    }

    if (currentCheckedValues.includes(val)) {
      currentCheckedValues = currentCheckedValues.filter(
        (element) => element != val
      );
    } else {
      currentCheckedValues.push(val);
    }
    console.log(currentCheckedValues);
    setChosenValues(currentCheckedValues);
  }
  return (
    <fieldset>
      <div className="block text-sm/6 font-medium text-gray-900">
        {headline}
      </div>
      <div className="space-y-2">
        <div className="grid grid-cols-4">
          {items?.map((element: CheckboxItem) => {
            return (
              <div key={element.key} className="flex gap-3 pt-2">
                <div className="flex h-6 shrink-0 items-center">
                  <div className="group grid size-4 grid-cols-1">
                    <input
                      onChange={(e) => checkboxChecked(e)}
                      id={element.key}
                      name={element.key}
                      type="checkbox"
                      aria-describedby="comments-description"
                      className="col-start-1 row-start-1 appearance-none rounded border border-gray-300 bg-white checked:border-indigo-600 checked:bg-indigo-600 indeterminate:border-indigo-600 indeterminate:bg-indigo-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:border-gray-300 disabled:bg-gray-100 disabled:checked:bg-gray-100 forced-colors:appearance-auto"
                    />
                    <svg
                      fill="none"
                      viewBox="0 0 14 14"
                      className="pointer-events-none col-start-1 row-start-1 size-3.5 self-center justify-self-center stroke-white group-has-[:disabled]:stroke-gray-950/25"
                    >
                      <path
                        d="M3 8L6 11L11 3.5"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="opacity-0 group-has-[:checked]:opacity-100"
                      />
                      <path
                        d="M3 7H11"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="opacity-0 group-has-[:indeterminate]:opacity-100"
                      />
                    </svg>
                  </div>
                </div>
                <div className="text-sm/6">
                  <label
                    htmlFor="comments"
                    className="font-medium text-gray-900"
                  >
                    {element.label}
                  </label>
                  <span id="comments-description" className="text-gray-500">
                    <span className="sr-only">{element.label} </span>
                    {element.description}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </fieldset>
  );
}
