import type { PropsWithChildren } from "react";
import { createContext, useContext, useMemo, useState } from "react";

import { initialWorks, type Work } from "@/data/works";

type WorksContextValue = {
  works: Work[];
  getWorkById: (id: string) => Work | undefined;
  createWork: (work: Pick<Work, "title" | "details" | "summary">) => void;
  updateWork: (id: string, changes: Pick<Work, "title" | "details" | "summary">) => void;
  deleteWork: (id: string) => void;
};

const WorksContext = createContext<WorksContextValue | undefined>(undefined);

export function WorksProvider({ children }: PropsWithChildren) {
  const [works, setWorks] = useState<Work[]>(initialWorks);

  const value = useMemo<WorksContextValue>(
    () => ({
      works,
      getWorkById: (id) => works.find((work) => work.id === id),
      createWork: ({ title, details, summary }) => {
        setWorks((prev) => [
          {
            id: Date.now().toString(),
            title,
            details,
            summary,
            updatedAt: new Date().toISOString(),
          },
          ...prev,
        ]);
      },
      updateWork: (id, changes) => {
        setWorks((prev) =>
          prev.map((work) =>
            work.id === id
              ? {
                  ...work,
                  ...changes,
                  updatedAt: new Date().toISOString(),
                }
              : work
          )
        );
      },
      deleteWork: (id) => {
        setWorks((prev) => prev.filter((work) => work.id !== id));
      },
    }),
    [works]
  );

  return <WorksContext.Provider value={value}>{children}</WorksContext.Provider>;
}

export function useWorks() {
  const context = useContext(WorksContext);

  if (!context) {
    throw new Error("useWorks must be used within a WorksProvider");
  }

  return context;
}
