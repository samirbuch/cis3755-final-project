import { useState } from "react";

export default function useArrayState<T>(initialValue?: T[]) {
  const [array, setArray] = useState<T[]>(initialValue || []);

  const push = (item: T) => {
    setArray((prev) => [...prev, item]);
  };

  const pop = (index: number) => {
    setArray((prev) => prev.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, newItem: T) => {
    setArray((prev) =>
      prev.map((item, i) => (i === index ? newItem : item))
    );
  };

  const removeIndex = (index: number) => {
    setArray((prev) => prev.filter((_, i) => i !== index));
  }

  return {
    array,
    push,
    pop,
    updateItem,
    dangerousSetArray: setArray,
    removeIndex,
  };
}