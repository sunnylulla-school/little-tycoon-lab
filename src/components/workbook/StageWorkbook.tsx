import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useAssignment, useProgress, useUnlocks } from "@/hooks/useProgress";
import { SCENARIOS, getScenario, totalCost, PRINCIPLES, Scenario, calcOutcome, CAR_WASH_PRICES } from "@/lib/scenarios";
import { isNumComplete, isSelectComplete, isTextComplete } from "@/lib/validators";
import { GUIDE_PIN } from "@/config";
import {
  ActivityHeading,
  CheckBox,
  ExampleBox,
  FieldCheck,
  MathRow,
  NowYouTry,
  Overline,
  ReadableParagraph,
  SectionHeading,
  SidebarBox,
  StepBar,
} from "./Primitives";
import { SpeakButton } from "@/components/SpeakButton";
import { Button } from "@/components/ui/button";
import { GuideSignOffModal } from "@/components/GuideSignOffModal";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Lock } from "lucide-react";

type Mode = "guided" | "blank";

interface Props {
  stage: 1 | 2 | 3;
  mode: Mode;
}

const STAGE1_PAGES = ["intro", "pick", "step1", "step2", "step3", "step4"] as const;
const BLANK_PAGES = ["step1", "step2", "step3", "step4"] as const;

export const StageWorkbook = ({ stage, mode }: Props) => {
  const nav = useNavigate();
  const { student } = useAuth();
  const { get, setValue, flush, loaded } = useProgress();
  const { unlock, unlocked } = useUnlocks();
  const { scenarioId, assign } = useAssignment(stage);

  // For stage 2/3: auto-assign on first load
  useEffect(() => {
    if (stage === 1 || !student || scenarioId !== null) return;
    (async () => {
      // Find used scenarios
      const { data: assigns } = await supabase
        .from("scenario_assignments")
        .select("*")
        .eq("student_id", student.id);
      const used = new Set<number>((assigns || []).map((a: any) => a.scenario_id));
      // Stage 3 also avoids stage3_attempts scenarios
      if (stage === 3) {
        const { data: atts } = await supabase
          .from("stage3_attempts")
          .select("scenario_id")
          .eq("student_id", student.id);
        (atts || []).forEach((a: any) => used.add(a.scenario_id));
      }
      const remaining = SCENARIOS.filter((s) => !used.has(s.id));
      const pool = remaining.length > 0 ? remaining : SCENARIOS;
      const pick = pool[Math.floor(Math.random() * pool.length)];
      await assign(pick.id);
    })();
  }, [stage, student, scenarioId, assign]);

  const pages = mode === "guided" ? STAGE1_PAGES : BLANK_PAGES;
  const [pageIdx, setPageIdx] = useState(0);
  const page = pages[pageIdx];

  useEffect(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }, [pageIdx]);

  if (!loaded) return <div className="p-8 text-center text-muted-foreground">Loading...</div>;

  // Stage 1 uses the student's pick on Step 0; Stage 2/3 use the auto-assigned scenario.
  const pickedId = parseInt(get(stage, "pick", "scenario") || "0", 10);
  const effectiveScenarioId = stage === 1 ? (pickedId || null) : scenarioId;
  const scenario = effectiveScenarioId ? getScenario(effectiveScenarioId) : null;

  // Page completion logic
  const pageComplete = (p: string): boolean => {
    if (p === "intro") return get(stage, "intro", "scrolled") === "1";
    if (p === "pick") return isSelectComplete(get(stage, "pick", "scenario"));
    if (!scenario) return false;
    const skipChecks = stage === 1;
    if (p === "step1") {
      const decisionsOk = scenario.decisions.every((d) => isSelectComplete(get(stage, "step1", d.id)));
      const perDecText = scenario.decisions.every((d) => isTextComplete(get(stage, "step1", `dec_text_${d.id}`)));
      const checks = skipChecks || [0, 1, 2].every((i) => get(stage, "step1", `chk_${i}`) === "1");
      return decisionsOk && perDecText && checks;
    }
    if (p === "step2") {
      const revOk =
        scenario.productType === "single"
          ? isNumComplete(get(stage, "step2", "qty"))
          : isNumComplete(get(stage, "step2", "qty_b")) && isNumComplete(get(stage, "step2", "qty_c"));
      const checks = skipChecks || [0, 1, 2, 3].every((i) => get(stage, "step2", `chk_${i}`) === "1");
      return revOk && checks;
    }
    if (p === "step3") {
      const p1 = isSelectComplete(get(stage, "step3", "p1")) && isTextComplete(get(stage, "step3", "p1_text"));
      const p2 = isSelectComplete(get(stage, "step3", "p2")) && isTextComplete(get(stage, "step3", "p2_text"));
      const checks = skipChecks || [0, 1, 2].every((i) => get(stage, "step3", `chk_${i}`) === "1");
      return p1 && p2 && checks;
    }
    if (p === "step4") {
      const t1 = isTextComplete(get(stage, "step4", "change"));
      const t2 = isTextComplete(get(stage, "step4", "why"));
      const checks = skipChecks || [0, 1].every((i) => get(stage, "step4", `chk_${i}`) === "1");
      return t1 && t2 && checks;
    }
    return false;
  };

  const stageComplete = pages.every((p) => pageComplete(p));

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      {/* Page nav within stage */}
      <div className="flex flex-wrap gap-2 mb-6">
        {pages.map((p, i) => {
          const done = pageComplete(p);
          const reachable = i === 0 || pages.slice(0, i).every((pp) => pageComplete(pp));
          return (
            <button
              key={p}
              disabled={!reachable}
              onClick={() => setPageIdx(i)}
              className={`text-[12px] px-3 py-1.5 rounded-md border flex items-center gap-1 ${
                pageIdx === i ? "bg-navy text-white border-navy" : reachable ? "bg-white" : "bg-muted text-muted-foreground"
              }`}
            >
              {!reachable && <Lock className="w-3 h-3" />}
              {pageLabel(p)}
              {done && <span className="text-[hsl(var(--success))]">✓</span>}
            </button>
          );
        })}
      </div>

      {page === "intro" && <IntroPage stage={stage} get={get} setValue={setValue} onContinue={() => setPageIdx(1)} />}
      {page === "pick" && <PickPage stage={stage} get={get} setValue={setValue} />}
      {page === "step1" && scenario && (
        <Step1 stage={stage} mode={mode} scenario={scenario} get={get} setValue={setValue} flush={flush} />
      )}
      {page === "step2" && scenario && (
        <Step2 stage={stage} mode={mode} scenario={scenario} get={get} setValue={setValue} flush={flush} />
      )}
      {page === "step3" && scenario && (
        <Step3 stage={stage} mode={mode} get={get} setValue={setValue} flush={flush} />
      )}
      {page === "step4" && scenario && (
        <Step4 stage={stage} mode={mode} get={get} setValue={setValue} flush={flush} />
      )}

      {/* Next button — shown on every page except intro (handled inline) and the last page */}
      {page !== "intro" && pageIdx < pages.length - 1 && (
        <div className="mt-8 text-center">
          <Button
            className="bg-navy text-white hover:bg-navy/90"
            disabled={!pageComplete(page)}
            onClick={() => setPageIdx(pageIdx + 1)}
          >
            {pageComplete(page) ? `Continue to ${pageLabel(pages[pageIdx + 1])}` : "Finish this page to continue"}
          </Button>
        </div>
      )}

      {/* Stage sign-off / pass-fail */}
      {page === pages[pages.length - 1] && (
        <StageFooter
          stage={stage}
          stageComplete={stageComplete}
          scenario={scenario}
          get={get}
          setValue={setValue}
          unlock={unlock}
          assign={assign}
          unlocked={unlocked}
        />
      )}
    </div>
  );
};

function pageLabel(p: string) {
  return (
    {
      intro: "Before You Begin",
      pick: "Step 0 — Pick",
      step1: "Step 1 — Run It",
      step2: "Step 2 — Math",
      step3: "Step 3 — Principles",
      step4: "Step 4 — Strategy",
    } as Record<string, string>
  )[p] || p;
}

/* ============== Pages ============== */

function IntroPage({ stage, get, setValue, onContinue }: any) {
  // First time: require 30 sec + scroll. After that: always unlocked.
  const alreadyDone = get(stage, "intro", "scrolled") === "1";
  const [seconds, setSeconds] = useState(0);
  const [scrolled, setScrolled] = useState(alreadyDone);

  useEffect(() => {
    if (alreadyDone) return;
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    const onScroll = () => {
      if (window.scrollY + window.innerHeight >= document.body.scrollHeight - 30) {
        setScrolled(true);
      }
    };
    window.addEventListener("scroll", onScroll);
    return () => {
      clearInterval(t);
      window.removeEventListener("scroll", onScroll);
    };
  }, [alreadyDone]);

  const ready = alreadyDone || (seconds >= 30 && scrolled);

  useEffect(() => {
    if (ready && !alreadyDone) setValue(stage, "intro", "scrolled", "1");
  }, [ready, alreadyDone]);


  const introP1 = "An entrepreneur is someone who starts and runs a business. They notice a problem, come up with an idea, and then make decisions every single day to make it work. Running a lemonade stand, a bake sale, or a car wash — those are all things entrepreneurs do.";
  const introP2 = "Every business decision has a money result. Smart entrepreneurs think about that before they choose. That is exactly what you are going to practice.";
  const sidebar1 = "The three things every entrepreneur has to understand. Where their money comes from, that is called Revenue. What they spent to run the business, that is called Cost. What they actually get to keep, that is called Profit.";
  const basicsP = "You do not need to memorize a long list. You just need to understand five ideas well enough to spot them when you are running your own scenario. Read through Marcus's story below — all five ideas show up in it.";
  const marcusStory = "It was a hot Saturday at the park. Marcus set up a lemonade stand. He spent eight dollars buying lemons, sugar, cups, and a sign before he sold a single cup. That eight dollars was his Cost — money he had to spend just to get started. He charged one dollar per cup and sold twelve cups. That brought in twelve dollars. That twelve dollars was his Revenue — all the money that came in. He took the twelve dollars he made and subtracted the eight dollars he spent. Twelve minus eight equals four. That four dollars was his Profit — what he actually got to keep. Marcus set up near the playground because that is where thirsty kids were. He was thinking about his Customer — who is buying, and what do they want? After it was over, Marcus thought: next time I would set up earlier in the day when more people are outside. That kind of thinking is called Strategy — making a plan to get a better result.";
  const fiveIdeas = "The five ideas in plain English. Revenue: all the money you brought in from selling. Cost: all the money you spent before you sold anything. Profit: what you keep. Profit equals Revenue minus Cost. Customer: the person buying from you. Think about what they want. Strategy: a deliberate plan to get a better result next time.";

  return (
    <div>
      <Overline>BEFORE YOU BEGIN</Overline>
      <SectionHeading speak="What is an entrepreneur?">What Is an Entrepreneur?</SectionHeading>
      <ReadableParagraph>{introP1}</ReadableParagraph>
      <ReadableParagraph>{introP2}</ReadableParagraph>
      <SidebarBox title="The three things every entrepreneur has to understand" speak={sidebar1}>
        <ul className="list-disc pl-5 space-y-1">
          <li>Where their money comes from — that is called Revenue.</li>
          <li>What they spent to run the business — that is called Cost.</li>
          <li>What they actually get to keep — that is called Profit.</li>
        </ul>
      </SidebarBox>

      <div className="mt-8">
        <Overline>THE BASICS</Overline>
        <SectionHeading speak="Five ideas to know.">Five Ideas to Know</SectionHeading>
        <ReadableParagraph>{basicsP}</ReadableParagraph>
        <ExampleBox label="MARCUS'S STORY — Lemonade Stand" name="Marcus T., Grade 3" speak={marcusStory}>
          {marcusStory}
        </ExampleBox>

        <SidebarBox title="The five ideas — in plain English" speak={fiveIdeas}>
          <ul className="list-disc pl-5 space-y-1">
            <li>Revenue — all the money you brought in from selling.</li>
            <li>Cost — all the money you spent before you sold anything.</li>
            <li>Profit — what you keep. Profit = Revenue minus Cost.</li>
            <li>Customer — the person buying from you. Think about what they want.</li>
            <li>Strategy — a deliberate plan to get a better result next time.</li>
          </ul>
        </SidebarBox>

        <ReadableParagraph>You will see all five of these ideas show up when you run your own scenario. Keep this page open while you work.</ReadableParagraph>
      </div>

      <div className="mt-8 text-center">
        <Button
          className="bg-navy text-white hover:bg-navy/90"
          disabled={!ready}
          onClick={onContinue}
        >
          {ready ? "Continue to Step 0" : `Read for ${Math.max(0, 30 - seconds)}s${scrolled ? "" : " and scroll to bottom"}`}
        </Button>
      </div>
    </div>
  );
}

function PickPage({ stage, get, setValue }: any) {
  const selected = get(stage, "pick", "scenario");
  return (
    <div>
      <StepBar step={0} title="Pick Your Scenario" />
      <p className="body-text mb-4">
        You are going to run one of four simulated business scenarios. Each one asks you to make real decisions — where to
        set up, how much to make, whether to offer a deal. Your decisions affect your results. Pick one. You will use this
        same scenario for all of Stage 1.
      </p>
      <div className="grid sm:grid-cols-2 gap-3 mt-4">
        {SCENARIOS.map((s) => {
          const isSel = String(s.id) === selected;
          return (
            <button
              key={s.id}
              className={`scenario-card text-left ${isSel ? "scenario-card-selected" : ""}`}
              onClick={() => setValue(stage, "pick", "scenario", String(s.id))}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="overline">SCENARIO {s.id}</div>
                  <div className="text-[18px] font-bold text-navy mt-1">{s.name}</div>
                  <div className="text-[13px] text-muted-foreground mt-1">{s.short}</div>
                  <div className="text-[12px] mt-2 text-[#222]">{s.setup}</div>
                </div>
              </div>
              <div className="mt-2" onClick={(e) => e.stopPropagation()}>
                <SpeakButton text={`Scenario ${s.id}. ${s.name}. ${s.setup}`} />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ScenarioSetup({ scenario }: { scenario: Scenario }) {
  const speakText = `Scenario ${scenario.id}: ${scenario.name}. ${scenario.setup}`;
  return (
    <div className="border rounded-md p-4 bg-white mb-4">
      <div className="flex items-start justify-between gap-2">
        <div className="overline">SCENARIO {scenario.id}: {scenario.name.toUpperCase()}</div>
        <SpeakButton text={speakText} />
      </div>
      <p className="body-text mt-2">{scenario.setup}</p>
    </div>
  );
}

function Step1({ stage, mode, scenario, get, setValue, flush }: any) {
  const allDecisionsMade = scenario.decisions.every(
    (d: any) => get(stage, "step1", d.id)
  );

  const decisionMap = Object.fromEntries(
    scenario.decisions.map((d: any) => [d.id, get(stage, "step1", d.id)])
  ) as Record<string, "A" | "B" | "C">;

  const outcome = allDecisionsMade ? calcOutcome(scenario, decisionMap) : null;

  const marcusForIndex = (i: number) => {
    const examples = [
      {
        label: "MARCUS'S EXAMPLE — How many to make",
        body:
          "I made 15 cups because I thought that was enough for a hot Saturday at the park without wasting money on extras. If I made too many, leftover lemonade would be wasted. If I made too few, I might run out before customers came.",
      },
      {
        label: "MARCUS'S EXAMPLE — Where to set up",
        body:
          "I set up near the playground because that is where the most kids would be on a hot day. Kids playing outside get thirsty. Picking the right spot means more customers walk by my stand.",
      },
      {
        label: "MARCUS'S EXAMPLE — Offering a deal",
        body:
          "I did not offer a deal because one dollar a cup was already a fair price. If I lowered the price too much, I would not have enough money left to call it a profit.",
      },
    ];
    return examples[i] || examples[examples.length - 1];
  };

  return (
    <div>
      <StepBar step={1} title="Run It" />
      {mode === "guided" && (
        <ReadableParagraph>
          {`Read the setup. Then for each decision, choose one option and explain why you made that choice. After each one, you can see how Marcus thought about a similar decision in his lemonade stand.`}
        </ReadableParagraph>
      )}
      <ScenarioSetup scenario={scenario} />

      <ActivityHeading speak="Activity 1. Your decisions. Answer each question one at a time.">
        Activity 1 — Your Decisions
      </ActivityHeading>

      <div className="space-y-6">
        {scenario.decisions.map((d: any, i: number) => {
          const sel = get(stage, "step1", d.id);
          const decTextKey = `dec_text_${d.id}`;
          const ex = marcusForIndex(i);
          return (
            <div key={d.id} className="border rounded-md p-4 bg-white">
              <div className="text-[14px] font-bold text-navy mb-2 flex items-center gap-2">
                <span>Question {i + 1}: {d.question}</span>
                <SpeakButton text={`Question ${i + 1}. ${d.question}`} />
                <FieldCheck ok={isSelectComplete(sel) && isTextComplete(get(stage, "step1", decTextKey))} />
              </div>
              <div className="grid sm:grid-cols-3 gap-2">
                {d.options.map((o: any) => {
                  const isSel = sel === o.key;
                  return (
                    <button
                      key={o.key}
                      className={`decision-btn ${isSel ? "decision-btn-selected" : ""}`}
                      onClick={() => setValue(stage, "step1", d.id, o.key)}
                    >
                      <span className="font-bold">{o.key}.</span> {o.label}
                    </button>
                  );
                })}
              </div>

              <div className="mt-4">
                <TextField
                  label="Which decision did you choose, and why?"
                  rows={3}
                  speak="Which decision did you choose, and why? Write at least one sentence explaining your thinking."
                  value={get(stage, "step1", decTextKey)}
                  onChange={(v) => setValue(stage, "step1", decTextKey, v, { debounce: true })}
                  onBlur={() => flush(stage, "step1", decTextKey)}
                />
              </div>

              {mode === "guided" && (
                <ExampleBox label={ex.label} name="Marcus T., Grade 3" speak={ex.body}>
                  {ex.body}
                </ExampleBox>
              )}
            </div>
          );
        })}
      </div>

      {allDecisionsMade && outcome ? (
        <div className="mt-6 border-2 border-gold rounded-md p-4 bg-white">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="overline">YOUR RESULTS</div>
            {outcome && (
              <SpeakButton
                text={
                  outcome.type === "single"
                    ? `Your results are in. You sold ${outcome.unitsSold} ${scenario.unitLabel}. Based on your decisions. Head to the Math step to calculate your revenue, cost, and profit.`
                    : `Your results are in. You sold ${outcome.bookmarksSold} bookmarks and ${outcome.cardsSold} cards. Head to the Math step to calculate your revenue, cost, and profit.`
                }
              />
            )}
          </div>
          <div className="text-[15px] text-[#222]">
            {outcome.type === "single" ? (
              <div>
                <div className="font-bold text-navy text-[18px] mb-1">
                  You sold {outcome.unitsSold} {scenario.unitLabel}.
                </div>
                <div className="text-[14px] text-muted-foreground">
                  Based on your decisions, {outcome.unitsSold} {scenario.unitLabel} sold at ${outcome.price} each.
                </div>
              </div>
            ) : (
              <div>
                <div className="font-bold text-navy text-[18px] mb-1">
                  You sold {outcome.bookmarksSold} bookmarks and {outcome.cardsSold} cards.
                </div>
                <div className="text-[14px] text-muted-foreground">
                  Based on your decisions and your display choices.
                </div>
              </div>
            )}
            <div className="mt-3 text-[13px] text-navy font-bold">
              Head to the Math step to calculate your revenue, cost, and profit.
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-6 text-[13px] text-muted-foreground italic">
          Make all three decisions above to see your results.
        </div>
      )}
    </div>
  );
}

function UnlockDecisions({ onUnlock }: { onUnlock: () => void }) {
  const [open, setOpen] = useState(false);
  const [pin, setPin] = useState("");
  return (
    <div className="text-right">
      {!open ? (
        <button className="text-[12px] text-muted-foreground underline" onClick={() => setOpen(true)}>
          Need to change a decision? (guide PIN)
        </button>
      ) : (
        <div className="flex gap-2 justify-end">
          <input
            className="border rounded px-2 py-1 text-[13px]"
            placeholder="PIN"
            type="password"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
          />
          <Button
            size="sm"
            onClick={() => {
              if (pin === GUIDE_PIN) {
                onUnlock();
                setOpen(false);
                setPin("");
                toast("Decisions unlocked.");
              } else toast("That PIN is not right — try again.");
            }}
          >
            Unlock
          </Button>
        </div>
      )}
    </div>
  );
}

function Step2({ stage, mode, scenario, get, setValue, flush }: any) {
  const tCost = totalCost(scenario);

  const decisionMap2 = Object.fromEntries(
    scenario.decisions.map((d: any) => [d.id, get(stage, "step1", d.id)])
  ) as Record<string, "A" | "B" | "C">;

  const allMade2 = scenario.decisions.every((d: any) => get(stage, "step1", d.id));
  const prefilledOutcome = allMade2 ? calcOutcome(scenario, decisionMap2) : null;

  // Pre-populate revenue qty fields from outcome if empty
  useEffect(() => {
    if (!prefilledOutcome) return;
    if (prefilledOutcome.type === "single") {
      if (!get(stage, "step2", "qty")) {
        setValue(stage, "step2", "qty", String(prefilledOutcome.unitsSold));
      }
    } else {
      if (!get(stage, "step2", "qty_b")) {
        setValue(stage, "step2", "qty_b", String(prefilledOutcome.bookmarksSold));
      }
      if (!get(stage, "step2", "qty_c")) {
        setValue(stage, "step2", "qty_c", String(prefilledOutcome.cardsSold));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefilledOutcome?.type]);

  const singlePrice =
    scenario.id === 3
      ? CAR_WASH_PRICES[decisionMap2.d3] ?? 5
      : scenario.pricePerItem || 0;

  let revenue = 0;
  if (scenario.productType === "single") {
    const q = parseFloat(get(stage, "step2", "qty")) || 0;
    revenue = q * singlePrice;
  } else {
    const b = parseFloat(get(stage, "step2", "qty_b")) || 0;
    const c = parseFloat(get(stage, "step2", "qty_c")) || 0;
    revenue = b * 1 + c * 2;
  }
  const profit = revenue - tCost;

  return (
    <div>
      <StepBar step={2} title="Do the Math" />
      {mode === "guided" && (
        <p className="body-text mb-4">
          Every business decision has a money result. Now you are going to calculate yours. You may use a calculator for all of this.
        </p>
      )}

      {prefilledOutcome && (
        <div className="border-2 border-gold rounded-md p-4 bg-white mb-4">
          <div className="overline mb-2">YOUR RESULTS FROM STEP 1</div>
          {prefilledOutcome.type === "single" ? (
            <div className="text-[15px] font-bold text-navy">
              You sold {prefilledOutcome.unitsSold} {scenario.unitLabel} at ${prefilledOutcome.price} each.
            </div>
          ) : (
            <div className="text-[15px] font-bold text-navy">
              You sold {prefilledOutcome.bookmarksSold} bookmarks and {prefilledOutcome.cardsSold} cards.
            </div>
          )}
          <div className="text-[13px] text-muted-foreground mt-2">
            Use these numbers in the revenue calculation below.
          </div>
        </div>
      )}

      <ActivityHeading>Activity 2 — Revenue</ActivityHeading>
      {mode === "guided" && (
        <SidebarBox title="What is Revenue?">
          <ul className="list-disc pl-5 space-y-1">
            <li>Revenue is all the money you brought in from selling. It is the total BEFORE you subtract anything.</li>
            <li>Formula: Number sold × Price per item = Revenue.</li>
            {scenario.id === 4 && <li>Formula: (Bookmarks sold × $1) + (Cards sold × $2) = Revenue.</li>}
          </ul>
        </SidebarBox>
      )}
      {mode === "guided" && (
        <ExampleBox label="MARCUS'S EXAMPLE" name="Marcus T., Grade 3">
          I sold 12 cups at $1 each. 12 × $1 = $12. My revenue is $12.
        </ExampleBox>
      )}
      {mode === "guided" && <NowYouTry />}

      {scenario.productType === "single" ? (
        <div className="space-y-2">
          <div className="text-[13px] text-muted-foreground italic">
            Your result from Step 1 is pre-filled. The total calculates automatically.
          </div>
          <NumberField
            label="How many did I sell?"
            value={get(stage, "step2", "qty")}
            onChange={(v) => setValue(stage, "step2", "qty", v)}
          />
          <div className="text-[13px] text-muted-foreground">Price per item: ${singlePrice}</div>
          <MathRow label="MY REVENUE" value={`$${revenue}`} result />
        </div>
      ) : (
        <div className="space-y-2">
          <div className="text-[13px] text-muted-foreground italic">
            Your results from Step 1 are pre-filled. The total calculates automatically.
          </div>
          <NumberField
            label="How many bookmarks did I sell?"
            value={get(stage, "step2", "qty_b")}
            onChange={(v) => setValue(stage, "step2", "qty_b", v)}
          />
          <div className="text-[13px] text-muted-foreground">Price per bookmark: $1</div>
          <NumberField
            label="How many cards did I sell?"
            value={get(stage, "step2", "qty_c")}
            onChange={(v) => setValue(stage, "step2", "qty_c", v)}
          />
          <div className="text-[13px] text-muted-foreground">Price per card: $2</div>
          <MathRow label="MY REVENUE" value={`$${revenue}`} result />
        </div>
      )}

      <ActivityHeading>Activity 3 — Cost</ActivityHeading>
      {mode === "guided" && (
        <SidebarBox title="What is Cost?">
          <ul className="list-disc pl-5 space-y-1">
            <li>Cost is all the money you spent BEFORE you started selling. You spent this money whether you sold anything or not.</li>
            <li>Add up every item. That total is your Cost.</li>
          </ul>
        </SidebarBox>
      )}
      {mode === "guided" && <NowYouTry />}

      <div className="border rounded-md overflow-hidden mt-2">
        {scenario.costItems.map((c: any) => (
          <MathRow key={c.name} label={c.name} value={`$${c.amount}`} />
        ))}
        <MathRow label="TOTAL COST" value={`$${tCost}`} result />
      </div>

      <ActivityHeading>Activity 4 — Profit</ActivityHeading>
      {mode === "guided" && (
        <SidebarBox title="What is Profit?">
          <ul className="list-disc pl-5 space-y-1">
            <li>Profit is what you actually get to keep after paying your costs.</li>
            <li>Profit = Revenue minus Cost.</li>
            <li>If your answer is a negative number that is a loss. It means you spent more than you made. That happens to real businesses too.</li>
          </ul>
        </SidebarBox>
      )}
      {mode === "guided" && (
        <ExampleBox label="MARCUS'S EXAMPLE" name="Marcus T., Grade 3">
          My revenue was $12. My cost was $8. $12 minus $8 = $4. My profit is $4. Revenue is NOT the same as profit. Profit is what is left AFTER costs.
        </ExampleBox>
      )}
      {mode === "guided" && <NowYouTry />}

      <div className="border rounded-md overflow-hidden">
        <MathRow label="My Revenue" value={`$${revenue}`} />
        <MathRow label="My Cost" value={`$${tCost}`} />
        <MathRow label="MY PROFIT" value={`$${profit}`} result />
      </div>
      {profit < 0 && (
        <div className="mt-2 text-[13px] font-bold text-gold">
          This is a loss — you spent more than you made. That happens to real businesses too. Think about why when you get to the strategy step.
        </div>
      )}

      {stage !== 1 && (
        <CheckBox
          items={[
            "I calculated my Revenue — number sold times price.",
            "I confirmed my Cost by reviewing every item.",
            "I calculated my Profit — Revenue minus Cost.",
            "If my profit is negative I understand why that happened.",
          ]}
          checked={[0, 1, 2, 3].map((i) => get(stage, "step2", `chk_${i}`) === "1")}
          onToggle={(i) =>
            setValue(stage, "step2", `chk_${i}`, get(stage, "step2", `chk_${i}`) === "1" ? "0" : "1")
          }
        />
      )}
    </div>
  );
}

function Step3({ stage, mode, get, setValue, flush }: any) {
  const p1 = get(stage, "step3", "p1");
  const p2 = get(stage, "step3", "p2");
  return (
    <div>
      <StepBar step={3} title="Spot the Principles" />
      {mode === "guided" && (
        <p className="body-text mb-4">
          Look back at the five ideas from page 1. Now think about what you actually did during your scenario. Which of those
          ideas showed up for you? Pick two. Write the name of each one and explain it in your own words — what it means AND
          how it showed up for you. Do not just copy the definition. Tell me what you actually did.
        </p>
      )}

      <ActivityHeading>Activity 5 — Two Principles You Used</ActivityHeading>

      {mode === "guided" && (
        <ExampleBox label="MARCUS'S EXAMPLE" name="Marcus T., Grade 3">
          Principle 1 — Customer. A customer is the person buying from you. I thought about who would be at the park on a hot
          day — kids who just played outside and needed something to drink. That is why I set up near the playground.
          Principle 2 — Profit. Profit is what you actually keep after paying your costs. I made $12 from selling lemonade
          but I had to spend $8 on supplies first. So my real profit was only $4 — not the whole $12.
        </ExampleBox>
      )}
      {mode === "guided" && <NowYouTry />}

      <PrincipleBlock
        n={1}
        value={p1}
        disabledOption={p2}
        text={get(stage, "step3", "p1_text")}
        onSelect={(v) => setValue(stage, "step3", "p1", v)}
        onText={(v) => setValue(stage, "step3", "p1_text", v, { debounce: true })}
        onBlur={() => flush(stage, "step3", "p1_text")}
      />
      <PrincipleBlock
        n={2}
        value={p2}
        disabledOption={p1}
        text={get(stage, "step3", "p2_text")}
        onSelect={(v) => setValue(stage, "step3", "p2", v)}
        onText={(v) => setValue(stage, "step3", "p2_text", v, { debounce: true })}
        onBlur={() => flush(stage, "step3", "p2_text")}
      />

      {stage !== 1 && (
        <CheckBox
          items={[
            "I named two different principles from the list.",
            "I explained what each one means in my own words.",
            "I connected each one to something I actually did — not just the definition.",
          ]}
          checked={[0, 1, 2].map((i) => get(stage, "step3", `chk_${i}`) === "1")}
          onToggle={(i) =>
            setValue(stage, "step3", `chk_${i}`, get(stage, "step3", `chk_${i}`) === "1" ? "0" : "1")
          }
        />
      )}
    </div>
  );
}

function PrincipleBlock({ n, value, disabledOption, text, onSelect, onText, onBlur }: any) {
  return (
    <div className="mt-4 border rounded-md p-4">
      <div className="text-[14px] font-bold text-navy mb-2">
        Principle {n} <FieldCheck ok={isSelectComplete(value) && isTextComplete(text)} />
      </div>
      <select
        className="border rounded-md px-3 py-2 text-[14px] w-full sm:w-64 mb-3"
        value={value}
        onChange={(e) => onSelect(e.target.value)}
      >
        <option value="">Select a principle…</option>
        {PRINCIPLES.map((p) => (
          <option key={p} value={p} disabled={p === disabledOption}>
            {p}
          </option>
        ))}
      </select>
      <TextField
        label="What it means and how it showed up for me:"
        rows={4}
        value={text}
        onChange={onText}
        onBlur={onBlur}
      />
    </div>
  );
}

function Step4({ stage, mode, get, setValue, flush }: any) {
  return (
    <div>
      <StepBar step={4} title="Your Strategy" />
      {mode === "guided" && (
        <p className="body-text mb-4">
          Strategy means making a deliberate plan to get a better result. Now that you have seen your numbers, think about
          what you would do differently if you ran this scenario again.
        </p>
      )}

      <ActivityHeading>Activity 6 — What Would You Change?</ActivityHeading>
      {mode === "guided" && (
        <SidebarBox title="What makes a strategy specific?">
          <ul className="list-disc pl-5 space-y-1">
            <li>You name a specific decision — not just "do better."</li>
            <li>You explain HOW that change would affect your profit.</li>
            <li>Vague: "I would try harder next time."</li>
            <li>Specific: "I would set up two hours earlier when more people are at the park — that would mean more customers and more revenue."</li>
          </ul>
        </SidebarBox>
      )}
      {mode === "guided" && (
        <ExampleBox label="MARCUS'S EXAMPLE" name="Marcus T., Grade 3">
          I would set up near the playground instead of near the parking lot. More kids walk by the playground when they are
          hot and thirsty. If more people see my stand, more people will buy, and my revenue goes up.
          <div className="not-italic mt-2 text-[12px]">
            Named a specific decision: location. Explained why: more customers = more revenue. Connected to profit: more
            revenue with same cost = bigger profit.
          </div>
        </ExampleBox>
      )}
      {mode === "guided" && <NowYouTry />}

      <TextField
        label="The one thing I would change:"
        rows={3}
        value={get(stage, "step4", "change")}
        onChange={(v) => setValue(stage, "step4", "change", v, { debounce: true })}
        onBlur={() => flush(stage, "step4", "change")}
      />
      <TextField
        label="Why that change would affect my profit:"
        rows={4}
        value={get(stage, "step4", "why")}
        onChange={(v) => setValue(stage, "step4", "why", v, { debounce: true })}
        onBlur={() => flush(stage, "step4", "why")}
      />

      {stage !== 1 && (
        <CheckBox
          items={[
            'I named one specific thing I would change — not just "do better."',
            "I explained exactly how that change would affect my profit.",
          ]}
          checked={[0, 1].map((i) => get(stage, "step4", `chk_${i}`) === "1")}
          onToggle={(i) =>
            setValue(stage, "step4", `chk_${i}`, get(stage, "step4", `chk_${i}`) === "1" ? "0" : "1")
          }
        />
      )}
    </div>
  );
}

/* ============== Footer (sign-off / pass-fail) ============== */

function StageFooter({ stage, stageComplete, scenario, get, setValue, unlock, assign, unlocked }: any) {
  const nav = useNavigate();
  const { student } = useAuth();
  const [openSign, setOpenSign] = useState(false);
  const [openConfirmRetry, setOpenConfirmRetry] = useState(false);
  const [confirmPin, setConfirmPin] = useState("");
  const [passedScreen, setPassedScreen] = useState<null | { attempt: number; scenarioName: string }>(null);

  if (!stageComplete || !scenario) {
    return (
      <div className="mt-10 text-center text-[13px] text-muted-foreground">
        Almost there — fill in every section to unlock guide sign-off.
      </div>
    );
  }

  const summary = buildSummary(stage, scenario, get);

  // STAGE 1 / 2 = sign-off only
  if (stage !== 3) {
    return (
      <>
        <div className="mt-10 text-center">
          <div className="mb-3 inline-block px-4 py-2 rounded-md bg-[hsl(var(--success)/0.12)] text-[hsl(var(--success))] font-bold text-[13px]">
            All pages complete — ready for guide sign-off
          </div>
          <div>
            <Button className="bg-navy text-white hover:bg-navy/90" onClick={() => setOpenSign(true)}>
              Ready for Guide Sign-Off
            </Button>
          </div>
        </div>
        <GuideSignOffModal
          open={openSign}
          onOpenChange={setOpenSign}
          title={`Guide Sign-Off — Stage ${stage}`}
          intro={`Your guide needs to review your work and enter the PIN to unlock Stage ${stage + 1}.`}
          summary={summary}
          checklist={[
            "Math is complete and correct",
            "Strategy names a specific decision and explains profit impact — not just \"do better\"",
            "Both principles are explained in the student's own words",
          ]}
          onPass={async () => {
            await unlock(stage + 1);
            setOpenSign(false);
            toast(`Stage ${stage + 1} is now unlocked. Nice work.`);
            nav(`/stage/${stage + 1}`);
          }}
        />
      </>
    );
  }

  // STAGE 3 — pass / fail
  return (
    <>
      <div className="mt-10 text-center">
        <Button className="bg-navy text-white hover:bg-navy/90" onClick={() => setOpenSign(true)}>
          Ready for Guide Sign-Off
        </Button>
      </div>
      <GuideSignOffModal
        open={openSign}
        onOpenChange={setOpenSign}
        title="Guide Sign-Off — Stage 3 Demonstration"
        intro="Review the student's work below, ask the four questions out loud, then complete the checklist."
        summary={
          <>
            {summary}
            <hr className="gold-rule my-3" />
            <div className="font-bold text-navy">ASK THESE QUESTIONS OUT LOUD — listen for real thinking, not memorized answers.</div>
            <ol className="list-decimal pl-5 mt-2 space-y-1">
              <li>Walk me through how you figured out your profit.</li>
              <li>What was one decision you made and why did you make it?</li>
              <li>If you ran this scenario again, what is one thing you would change and how would it affect your profit?</li>
              <li>Pick one principle you wrote down and tell me how you actually used it — not what it means, what you did.</li>
            </ol>
          </>
        }
        checklist={[
          "Math is correct — revenue, cost, and profit calculations are right",
          "Strategy names a specific decision and explains how it would affect profit — not just \"do better\"",
          "Two principles are named and explained in the student's own words — not copied definitions",
          "Student answered all four conversation questions out loud without reading from the screen",
        ]}
        showFail
        onPass={async () => {
          // Save attempt as pass
          const attemptNumber = await nextAttemptNumber(student.id);
          await supabase.from("stage3_attempts").insert({
            student_id: student.id,
            attempt_number: attemptNumber,
            scenario_id: scenario.id,
            field_values: collectFieldValues(stage, get),
            result: "pass",
            guide_pin_confirmed: true,
          });
          setOpenSign(false);
          setPassedScreen({ attempt: attemptNumber, scenarioName: scenario.name });
        }}
        onFail={() => {
          setOpenSign(false);
          setOpenConfirmRetry(true);
        }}
      />

      {/* Retry confirm */}
      {openConfirmRetry && (
        <RetryConfirm
          onCancel={() => setOpenConfirmRetry(false)}
          onConfirm={async () => {
            const attemptNumber = await nextAttemptNumber(student.id);
            await supabase.from("stage3_attempts").insert({
              student_id: student.id,
              attempt_number: attemptNumber,
              scenario_id: scenario.id,
              field_values: collectFieldValues(stage, get),
              result: "fail",
              guide_pin_confirmed: true,
            });
            // Pick a fresh scenario for stage 3
            const used = new Set<number>([scenario.id]);
            const { data: atts } = await supabase
              .from("stage3_attempts")
              .select("scenario_id")
              .eq("student_id", student.id);
            (atts || []).forEach((a: any) => used.add(a.scenario_id));
            const { data: assigns } = await supabase
              .from("scenario_assignments")
              .select("*")
              .eq("student_id", student.id);
            (assigns || []).forEach((a: any) => used.add(a.scenario_id));
            const remaining = SCENARIOS.filter((s) => !used.has(s.id));
            const pick = remaining.length > 0 ? remaining[0] : SCENARIOS[0];
            // Clear all stage 3 fields
            await supabase.from("progress").delete().eq("student_id", student.id).eq("stage", 3);
            await supabase
              .from("scenario_assignments")
              .upsert({ student_id: student.id, stage: 3, scenario_id: pick.id }, { onConflict: "student_id,stage" });
            setOpenConfirmRetry(false);
            toast("No problem — let's try again with a new scenario.");
            window.location.reload();
          }}
        />
      )}

      {passedScreen && (
        <PassScreen
          studentName={student?.name || "Student"}
          scenarioName={passedScreen.scenarioName}
          attempt={passedScreen.attempt}
          summary={summary}
        />
      )}
    </>
  );
}

async function nextAttemptNumber(studentId: string) {
  const { data } = await supabase
    .from("stage3_attempts")
    .select("attempt_number")
    .eq("student_id", studentId)
    .order("attempt_number", { ascending: false })
    .limit(1);
  return ((data?.[0] as any)?.attempt_number || 0) + 1;
}

function collectFieldValues(stage: number, get: any) {
  const keys = [
    ["step1", ["d1", "d2", "d3", "decisions_text", "results_text"]],
    ["step2", ["qty", "qty_b", "qty_c"]],
    ["step3", ["p1", "p1_text", "p2", "p2_text"]],
    ["step4", ["change", "why"]],
  ] as const;
  const o: Record<string, string> = {};
  for (const [page, ks] of keys) for (const k of ks) o[`${page}.${k}`] = get(stage, page, k);
  return o;
}

function buildSummary(stage: number, scenario: Scenario, get: any) {
  const tCost = totalCost(scenario);
  const decisionMap = Object.fromEntries(
    scenario.decisions.map((d) => [d.id, get(stage, "step1", d.id)])
  ) as Record<string, "A" | "B" | "C">;
  const allMade = scenario.decisions.every((d) => get(stage, "step1", d.id));
  const outcome = allMade ? calcOutcome(scenario, decisionMap) : null;

  let revenue = 0;
  if (outcome?.type === "single") revenue = outcome.revenue;
  else if (outcome?.type === "dual") revenue = outcome.revenue;
  const profit = revenue - tCost;

  return (
    <div className="space-y-3 text-[13px]">
      <div>
        <span className="font-bold">Scenario:</span> {scenario.name}
      </div>

      <div>
        <div className="font-bold mb-1">Decisions Made:</div>
        {scenario.decisions.map((d) => {
          const chosenKey = get(stage, "step1", d.id);
          const chosenOption = d.options.find((o) => o.key === chosenKey);
          const decText = get(stage, "step1", `dec_text_${d.id}`);
          return (
            <div key={d.id} className="ml-2 mb-2">
              <div className="font-semibold">{d.question}</div>
              <div>Chose: {chosenOption?.label || "—"}</div>
              {decText && <div className="italic text-muted-foreground">"{decText}"</div>}
            </div>
          );
        })}
      </div>

      {outcome && (
        <div>
          <div className="font-bold mb-1">Results:</div>
          {outcome.type === "single" ? (
            <div>{outcome.unitsSold} {scenario.unitLabel} sold</div>
          ) : (
            <div>{outcome.bookmarksSold} bookmarks and {outcome.cardsSold} cards sold</div>
          )}
        </div>
      )}

      <div>
        <div className="font-bold mb-1">Math:</div>
        {outcome?.type === "single" ? (
          <div>{outcome.unitsSold} sold × ${outcome.price} = ${revenue} revenue</div>
        ) : outcome?.type === "dual" ? (
          <div>{outcome.bookmarksSold} bookmarks × $1 + {outcome.cardsSold} cards × $2 = ${revenue} revenue</div>
        ) : null}
        <div>Cost: ${tCost}</div>
        <div>
          Profit: ${revenue} − ${tCost} ={" "}
          <span className="font-bold">${profit}</span>
        </div>
      </div>

      <div>
        <div className="font-bold">
          Principle 1 — {get(stage, "step3", "p1") || "not selected"}:
        </div>
        <div>{get(stage, "step3", "p1_text") || "—"}</div>
      </div>

      <div>
        <div className="font-bold">
          Principle 2 — {get(stage, "step3", "p2") || "not selected"}:
        </div>
        <div>{get(stage, "step3", "p2_text") || "—"}</div>
      </div>

      <div>
        <div className="font-bold">Strategy — What they would change:</div>
        <div>{get(stage, "step4", "change") || "—"}</div>
        <div className="font-bold mt-1">Why it affects profit:</div>
        <div>{get(stage, "step4", "why") || "—"}</div>
      </div>
    </div>
  );
}

function RetryConfirm({ onCancel, onConfirm }: { onCancel: () => void; onConfirm: () => void }) {
  const [pin, setPin] = useState("");
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-md p-6 max-w-md w-full">
        <div className="text-[16px] font-bold text-navy mb-2">Confirm retry</div>
        <p className="text-[13px] mb-3">Enter PIN again to give the student a new scenario.</p>
        <input
          className="border rounded px-3 py-2 w-full text-[14px]"
          type="password"
          placeholder="PIN"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
        />
        <div className="flex gap-2 justify-end mt-4">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            className="bg-navy text-white hover:bg-navy/90"
            onClick={() => {
              if (pin === GUIDE_PIN) onConfirm();
              else toast("That PIN is not right — try again.");
            }}
          >
            Confirm Retry
          </Button>
        </div>
      </div>
    </div>
  );
}

function PassScreen({
  studentName,
  scenarioName,
  attempt,
  summary,
}: {
  studentName: string;
  scenarioName: string;
  attempt: number;
  summary: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 bg-white overflow-y-auto p-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-6">
          <Overline>STAGE 3 — DEMONSTRATION</Overline>
          <h1 className="section-heading">Completion</h1>
          <hr className="gold-rule mt-2 mb-4" />
        </div>
        <div className="space-y-2 text-[14px]">
          <div><span className="font-bold">Student:</span> {studentName}</div>
          <div><span className="font-bold">Date:</span> {new Date().toLocaleDateString()}</div>
          <div><span className="font-bold">Scenario used:</span> {scenarioName}</div>
          <div><span className="font-bold">Passed on attempt:</span> #{attempt}</div>
        </div>
        <hr className="gold-rule my-4" />
        <div className="text-[13px]">{summary}</div>
        <hr className="gold-rule my-4" />
        <div className="text-[13px] text-muted-foreground">Guide sign-off confirmed.</div>
        <div className="mt-6 flex gap-2 justify-center print:hidden">
          <Button onClick={() => window.print()} className="bg-navy text-white hover:bg-navy/90">
            Print
          </Button>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ============== Inputs ============== */

function TextField({
  label,
  rows,
  value,
  onChange,
  onBlur,
  speak,
}: {
  label: string;
  rows: number;
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  speak?: string;
}) {
  const ok = isTextComplete(value);
  return (
    <div className="mt-4">
      <label className="text-[12px] font-bold text-navy uppercase tracking-wide flex items-center gap-2">
        {label}
        {speak && <SpeakButton text={speak} />}
        <FieldCheck ok={ok} />
      </label>
      <textarea
        rows={rows}
        className="write-area mt-1"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
      />
      <div className="text-[11px] text-muted-foreground mt-1">{value.length}/20 characters minimum</div>
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const ok = isNumComplete(value);
  return (
    <div>
      <label className="text-[13px] font-bold text-navy flex items-center">
        {label}
        <FieldCheck ok={ok} />
      </label>
      <input
        type="number"
        min="0"
        className="write-area mt-1 w-32"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
