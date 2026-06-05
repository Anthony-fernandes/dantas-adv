import { useEffect, useMemo, useState } from 'react';
import {
  buildProcessFormValues,
  createEmptyProcessForm,
  hasProcessFormChanges,
  validateProcessForm,
  type ProcessFormErrors,
  type ProcessFormValues,
} from '@/components/processes/ProcessValidation';

type TouchedFields = Partial<Record<keyof ProcessFormValues, boolean>>;

type UseProcessFormOptions = {
  open: boolean;
  mode: 'create' | 'edit';
  process?: Record<string, any> | null;
  defaultArea?: string;
  seedCnj?: string;
};

export function useProcessForm({
  open,
  mode,
  process,
  defaultArea = 'civel',
  seedCnj = '',
}: UseProcessFormOptions) {
  const initialValues = useMemo(
    () => (mode === 'edit'
      ? buildProcessFormValues(process || null, defaultArea)
      : createEmptyProcessForm(defaultArea, seedCnj)),
    [defaultArea, mode, process, seedCnj],
  );

  const initialSnapshot = useMemo(() => JSON.stringify(initialValues), [initialValues]);
  const stableInitialValues = useMemo(
    () => JSON.parse(initialSnapshot) as ProcessFormValues,
    [initialSnapshot],
  );

  const [values, setValues] = useState<ProcessFormValues>(stableInitialValues);
  const [touchedFields, setTouchedFields] = useState<TouchedFields>({});
  const [hasSubmitted, setHasSubmitted] = useState(false);

  useEffect(() => {
    if (!open) return;
    setValues(stableInitialValues);
    setTouchedFields({});
    setHasSubmitted(false);
  }, [open, stableInitialValues]);

  const validationErrors = useMemo(() => validateProcessForm(values), [values]);
  const visibleErrors = useMemo(() => {
    if (hasSubmitted) return validationErrors;

    return Object.entries(validationErrors).reduce((accumulator, [field, message]) => {
      const typedField = field as keyof ProcessFormValues;
      if (!touchedFields[typedField] || !message) return accumulator;
      accumulator[typedField] = message;
      return accumulator;
    }, {} as ProcessFormErrors);
  }, [hasSubmitted, touchedFields, validationErrors]);

  const isValid = Object.keys(validationErrors).length === 0;
  const isDirty = useMemo(
    () => hasProcessFormChanges(values, stableInitialValues),
    [stableInitialValues, values],
  );

  function updateField<K extends keyof ProcessFormValues>(field: K, value: ProcessFormValues[K]) {
    setValues((current) => (
      current[field] === value
        ? current
        : { ...current, [field]: value }
    ));
  }

  function touchField<K extends keyof ProcessFormValues>(field: K) {
    setTouchedFields((current) => (
      current[field]
        ? current
        : { ...current, [field]: true }
    ));
  }

  function validateBeforeSave() {
    setHasSubmitted(true);
    return Object.keys(validationErrors).length === 0;
  }

  function resetForm() {
    setValues(stableInitialValues);
    setTouchedFields({});
    setHasSubmitted(false);
  }

  return {
    values,
    errors: visibleErrors,
    validationErrors,
    isDirty,
    isValid,
    hasSubmitted,
    updateField,
    touchField,
    validateBeforeSave,
    resetForm,
  };
}
