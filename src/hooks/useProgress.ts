import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

// Loads all progress for a student into a record { "stage:page:key" -> value }
export function useProgress() {
  const { student } = useAuth();
  const [values, setValues] = useState<Record<string, string>>({});
  const [loaded, setLoaded] = useState(false);
  const debouncers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  useEffect(() => {
    if (!student) return;
    (async () => {
      const { data } = await supabase.from("progress").select("*").eq("student_id", student.id);
      const map: Record<string, string> = {};
      (data || []).forEach((r: any) => {
        map[`${r.stage}:${r.page}:${r.field_key}`] = r.field_value ?? "";
      });
      setValues(map);
      setLoaded(true);
    })();
  }, [student]);

  const persist = useCallback(
    async (stage: number, page: string, key: string, value: string) => {
      if (!student) return;
      await supabase
        .from("progress")
        .upsert(
          { student_id: student.id, stage, page, field_key: key, field_value: value, updated_at: new Date().toISOString() },
          { onConflict: "student_id,stage,page,field_key" }
        );
    },
    [student]
  );

  const setValue = useCallback(
    (stage: number, page: string, key: string, value: string, opts?: { debounce?: boolean }) => {
      const k = `${stage}:${page}:${key}`;
      setValues((v) => ({ ...v, [k]: value }));
      if (debouncers.current[k]) clearTimeout(debouncers.current[k]);
      const delay = opts?.debounce ? 2000 : 0;
      debouncers.current[k] = setTimeout(() => persist(stage, page, key, value), delay);
    },
    [persist]
  );

  const flush = useCallback(
    (stage: number, page: string, key: string) => {
      const k = `${stage}:${page}:${key}`;
      if (debouncers.current[k]) {
        clearTimeout(debouncers.current[k]);
        delete debouncers.current[k];
        persist(stage, page, key, values[k] ?? "");
      }
    },
    [persist, values]
  );

  const get = (stage: number, page: string, key: string) => values[`${stage}:${page}:${key}`] ?? "";

  return { values, loaded, setValue, flush, get };
}

// Stage unlocks
export function useUnlocks() {
  const { student } = useAuth();
  const [unlocked, setUnlocked] = useState<number[]>([1]); // stage 1 always
  const [loaded, setLoaded] = useState(false);

  const refresh = useCallback(async () => {
    if (!student) return;
    const { data } = await supabase.from("stage_unlocks").select("*").eq("student_id", student.id);
    const set = new Set<number>([1]);
    (data || []).forEach((r: any) => set.add(r.stage_unlocked));
    setUnlocked(Array.from(set).sort());
    setLoaded(true);
  }, [student]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const unlock = async (stage: number) => {
    if (!student) return;
    await supabase.from("stage_unlocks").upsert(
      { student_id: student.id, stage_unlocked: stage, unlocked_at: new Date().toISOString() },
      { onConflict: "student_id,stage_unlocked" }
    );
    await refresh();
  };

  return { unlocked, loaded, unlock, refresh };
}

// Scenario assignment
export function useAssignment(stage: number) {
  const { student } = useAuth();
  const [scenarioId, setScenarioId] = useState<number | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!student) return;
    (async () => {
      const { data } = await supabase
        .from("scenario_assignments")
        .select("*")
        .eq("student_id", student.id)
        .eq("stage", stage)
        .maybeSingle();
      setScenarioId(data ? (data as any).scenario_id : null);
      setLoaded(true);
    })();
  }, [student, stage]);

  const assign = async (id: number) => {
    if (!student) return;
    await supabase.from("scenario_assignments").upsert(
      { student_id: student.id, stage, scenario_id: id },
      { onConflict: "student_id,stage" }
    );
    setScenarioId(id);
  };

  const reassign = async (id: number) => {
    if (!student) return;
    await supabase
      .from("scenario_assignments")
      .upsert({ student_id: student.id, stage, scenario_id: id }, { onConflict: "student_id,stage" });
    setScenarioId(id);
  };

  return { scenarioId, loaded, assign, reassign };
}
