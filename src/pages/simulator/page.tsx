import { useCallback, useEffect, useRef, useState } from "react";
import BroadcastPanel from "@/pages/simulator/components/BroadcastPanel";
import Timetable from "@/pages/simulator/components/Timetable";
import AnnouncementList from "@/pages/simulator/components/AnnouncementList";
import PhraseSelector from "@/pages/simulator/components/PhraseSelector";
import VersionSwitcher from "@/pages/simulator/components/VersionSwitcher";
import AccountBar from "@/components/feature/AccountBar";
import MembershipBanner from "@/components/feature/MembershipBanner";
import { useCsatSimulator } from "@/hooks/useCsatSimulator";
import { useSpeech } from "@/hooks/useSpeech";
import { useListeningAudio } from "@/hooks/useListeningAudio";
import ListeningPanel from "@/pages/simulator/components/ListeningPanel";
import { CSAT_SCHEDULES, DEFAULT_CSAT_VERSION } from "@/mocks/csatSchedule";
import type { CsatSchedule, CsatVersionId } from "@/mocks/csatSchedule";
import type { CsatEvent } from "@/mocks/csatSchedule";
import type { CsatPhrase } from "@/mocks/csatPhrases";

function formatRemaining(totalSeconds: number): string {
  const remain = Math.max(0, Math.ceil(totalSeconds));
  const h = Math.floor(remain / 3600);
  const m = Math.floor((remain % 3600) / 60);
  if (h > 0) return `${h}시간 ${m}분`;
  return `${m}분`;
}

function useSimulator(schedule: CsatSchedule, listeningUrl: string | null) {
  const speech = useSpeech();

  const resolveAudio = useCallback(
    (event: CsatEvent) =>
      event.id === schedule.listeningEventId && listeningUrl
        ? listeningUrl
        : event.audioUrl,
    [schedule.listeningEventId, listeningUrl],
  );

  const handleEvent = useCallback(
    (event: CsatEvent, offsetSeconds: number) => {
      const audio = resolveAudio(event);
      if (event.id === schedule.listeningEventId) {
        /* 영어 듣기는 보호 채널로 재생 — 파일이 끝날 때까지 끊기지 않는다.
           이동한 시각이 있으면 그 위치부터 이어서 재생한다. */
        speech.playListening(audio, undefined, offsetSeconds);
        return;
      }
      /* 영어 듣기 방송 이후의 안내(예: "영어 영역 종료 10분 전")로 넘어가면
         재생 중이던 듣기 음원을 멈추고 안내방송을 재생한다. */
      const listeningEvent = schedule.events.find(
        (item) => item.id === schedule.listeningEventId,
      );
      if (listeningEvent && event.clockMin > listeningEvent.clockMin) {
        speech.stopListening();
      }
      speech.playAnnouncement(audio);
    },
    [speech, resolveAudio, schedule.listeningEventId, schedule.events],
  );

  const sim = useCsatSimulator(schedule, handleEvent);
  return { sim, speech };
}

export default function SimulatorPage() {
  const listening = useListeningAudio();
  const [version, setVersion] = useState<CsatVersionId>(DEFAULT_CSAT_VERSION);
  const schedule = CSAT_SCHEDULES[version];
  const { sim, speech } = useSimulator(schedule, listening.url);
  const [phrase, setPhrase] = useState<CsatPhrase | null>(null);
  const [volume, setVolume] = useState(1);

  useEffect(() => {
    speech.setRate(sim.speed);
  }, [speech, sim.speed]);

  useEffect(() => {
    speech.setVolume(volume);
  }, [speech, volume]);

  /* 버전이 바뀌면 재생 중이던 방송을 정리한다. */
  const speechRef = useRef(speech);
  speechRef.current = speech;
  useEffect(() => {
    speechRef.current.cancel();
  }, [version]);

  const handleToggle = () => {
    if (sim.status === "finished") {
      sim.reset();
      speech.primeListening(listening.url ?? undefined);
      sim.play();
      return;
    }
    if (sim.status === "running") {
      speech.pauseAudio();
    } else {
      speech.primeListening(listening.url ?? undefined);
      speech.resumeAudio();
    }
    sim.toggle();
  };

  const handleReset = () => {
    speech.cancel();
    sim.reset();
  };

  const handlePrevious = () => {
    speech.cancel();
    sim.previous();
  };

  const handleJump = (eventId: string) => {
    speech.primeListening(listening.url ?? undefined);
    speech.cancel();
    sim.jumpTo(eventId);
  };

  const handleJumpMinute = (minute: number) => {
    speech.primeListening(listening.url ?? undefined);
    speech.cancel();
    sim.jumpToMinute(minute);
  };

  const remaining = formatRemaining(schedule.endMin * 60 - sim.seconds);

  return (
    <div className="min-h-screen bg-background-100 font-body">
      <header className="border-b border-background-200 bg-background-50">
        <div className="mx-auto flex w-full flex-col gap-4 px-4 py-6 md:px-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-md bg-primary-500 text-background-50 dark:text-foreground-950">
                <i className="ri-megaphone-fill text-xl" aria-hidden="true"></i>
              </span>
              <div>
                <p className="text-xs font-medium tracking-wide text-primary-700">
                  {schedule.meta.exam}
                </p>
                <h1 className="font-heading text-xl font-bold text-foreground-950 md:text-2xl">
                  {schedule.meta.title}
                </h1>
              </div>
            </div>
            <div className="flex flex-col items-start gap-3 lg:items-end">
              <AccountBar />
              <VersionSwitcher value={version} onChange={setVersion} />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs text-foreground-600">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-background-100 px-3 py-1.5">
              <i className="ri-time-line text-primary-700" aria-hidden="true"></i>
              {schedule.meta.range}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-100 px-3 py-1.5 text-accent-900">
              <i className="ri-calendar-check-line" aria-hidden="true"></i>
              {schedule.info.longLabel} 시간표 · {schedule.info.description}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary-100 px-3 py-1.5 text-secondary-900">
              <i className="ri-mic-line" aria-hidden="true"></i>
              실제 방송 음원 재생
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1400px] px-4 py-6 md:px-6 md:py-8">
        <MembershipBanner />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="flex flex-col gap-6">
            <BroadcastPanel
              schedule={schedule}
              status={sim.status}
              clock={sim.clock}
              progress={sim.progress}
              activeEvent={sim.activeEvent}
              nextEvent={sim.nextEvent}
              phrase={phrase}
              speaking={speech.speaking}
              listeningReady={Boolean(listening.url)}
              speed={sim.speed}
              remainingLabel={remaining}
              volume={volume}
              onVolumeChange={setVolume}
              onSpeedChange={sim.setSpeed}
              onSeekMinute={handleJumpMinute}
              onToggle={handleToggle}
              onPrevious={handlePrevious}
              onNext={sim.next}
              onReset={handleReset}
            />
            <AnnouncementList
              schedule={schedule}
              activeEventId={sim.activeEvent?.id ?? null}
              onJump={handleJump}
            />
          </div>

          <aside className="flex flex-col gap-6">
            <ListeningPanel
              fileName={listening.fileName}
              audioUrl={listening.url}
              selectedTrackId={listening.selectedTrackId}
              loading={listening.loading}
              onSelectTrack={listening.selectTrack}
              onSelectShared={listening.selectShared}
              onUpload={listening.upload}
              onClear={listening.clear}
            />
            <PhraseSelector selected={phrase} onSelect={setPhrase} />
          </aside>
        </div>

        <div className="mt-6">
          <Timetable
            schedule={schedule}
            activeRowId={sim.activeRowId}
            currentMin={Math.floor(sim.seconds / 60)}
          />
        </div>

        <p className="mt-8 text-center text-[11px] leading-relaxed text-foreground-500">
          실제 수능 시험장 안내방송을 참고하여 재현한 시뮬레이터입니다. 등록된
          실제 방송 녹음 음원만 재생되며, 음원이 없는 안내는 자막으로만 표시됩니다.
          실제 시험장의 방송 내용과 세부 표현은 다를 수 있습니다.
        </p>
      </main>
    </div>
  );
}