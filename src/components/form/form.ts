import { createFormHook, formOptions } from "@tanstack/react-form";

import { defaultScenario } from "@/lib/scenario/defaults";
import { scenarioSchema } from "@/lib/scenario/schema";

import {
  BooleanToggleField,
  CheckboxField,
  NumberField,
  SelectField,
  SliderField,
  SwitchField,
  TextField,
  ToggleGroupField,
} from "./fields";
import { fieldContext, formContext } from "./form-context";

export const { useAppForm, withForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: {
    BooleanToggleField,
    CheckboxField,
    NumberField,
    SelectField,
    SliderField,
    SwitchField,
    TextField,
    ToggleGroupField,
  },
  formComponents: {},
});

/** Shared options so sections built with `withForm` are typed against the scenario. */
export const scenarioFormOptions = formOptions({
  defaultValues: defaultScenario(),
  validators: { onChange: scenarioSchema },
});
