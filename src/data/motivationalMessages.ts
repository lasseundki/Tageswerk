import type { Language } from '../types';

type Messages = Record<string, string[]>;

const messages: Record<Language, Messages> = {
  de: {
    earlyBird: [
      'Der frühe Vogel fängt den Wurm.',
      'Schon aktiv, bevor andere aufgestanden sind.',
      'Ein starker Start in den Morgen.',
    ],
    firstTask: [
      'Gut gestartet. Der erste Schritt ist getan.',
      'Der erste Haken des Tages — weiter so.',
      'Der Ball rollt. Mach weiter.',
    ],
    highPriority: [
      'Wichtiges erledigt. Das macht den Unterschied.',
      'Hohe Priorität — und du hast geliefert.',
      'Eine schwere Aufgabe vom Tisch.',
    ],
    overdue: [
      'Endlich vom Tisch. Du hast es geschafft.',
      'Überfällig und erledigt — das zählt doppelt.',
      'Diese Aufgabe wartet nicht mehr.',
    ],
    fiveTasks: [
      'Schon 5 heute — du bist im Fluss.',
      '5 Aufgaben. Du hast Rhythmus.',
    ],
    tenTasks: [
      '10 Aufgaben heute. Ausnahmeleistung.',
      'Zehn. Das ist ein starker Tag.',
    ],
    longOpen: [
      'Diese Aufgabe lag lange. Gut, dass du sie angepackt hast.',
      'Lange aufgeschoben, jetzt erledigt — das fühlt sich gut an.',
      'Manchmal braucht es Zeit. Aber du hast es geschafft.',
    ],
  },
  en: {
    earlyBird: [
      'The early bird catches the worm.',
      'Already active before most people are awake.',
      'A strong start to the morning.',
    ],
    firstTask: [
      'Good start. The first step is done.',
      'First task of the day — keep going.',
      'The ball is rolling. Keep it up.',
    ],
    highPriority: [
      'Important task done. That makes the difference.',
      'High priority — and you delivered.',
      'A hard task off your plate.',
    ],
    overdue: [
      'Finally done. You made it.',
      'Overdue and finished — that counts double.',
      "This task won't wait any longer.",
    ],
    fiveTasks: [
      "Already 5 today — you're in the flow.",
      '5 tasks. You have momentum.',
    ],
    tenTasks: [
      '10 tasks today. Outstanding.',
      "Ten. That's a strong day.",
    ],
    longOpen: [
      'This task was open for a while. Good that you tackled it.',
      'Long postponed, now done — that feels good.',
      'Sometimes it takes time. But you did it.',
    ],
  },
  es: {
    earlyBird: [
      'Al que madruga, Dios le ayuda.',
      'Ya activo antes de que la mayoría despierte.',
      'Un comienzo fuerte por la mañana.',
    ],
    firstTask: [
      'Buen comienzo. El primer paso está hecho.',
      'Primera tarea del día — sigue adelante.',
      'La pelota rueda. Continúa.',
    ],
    highPriority: [
      'Tarea importante completada. Eso marca la diferencia.',
      'Alta prioridad — y lo lograste.',
      'Una tarea difícil fuera del camino.',
    ],
    overdue: [
      'Por fin listo. Lo lograste.',
      'Atrasada y terminada — eso vale el doble.',
      'Esta tarea ya no puede esperar.',
    ],
    fiveTasks: [
      'Ya 5 hoy — estás en flujo.',
      '5 tareas. Tienes ritmo.',
    ],
    tenTasks: [
      '10 tareas hoy. Excepcional.',
      'Diez. Es un día fuerte.',
    ],
    longOpen: [
      'Esta tarea llevaba tiempo abierta. Bien que la hayas abordado.',
      'Pospuesta mucho tiempo, ahora hecha — eso se siente bien.',
      'A veces lleva tiempo. Pero lo lograste.',
    ],
  },
  pt: {
    earlyBird: [
      'Deus ajuda quem cedo madruga.',
      'Já ativo antes de a maioria acordar.',
      'Um começo forte pela manhã.',
    ],
    firstTask: [
      'Bom começo. O primeiro passo está feito.',
      'Primeira tarefa do dia — continue.',
      'A bola está rolando. Mantenha o ritmo.',
    ],
    highPriority: [
      'Tarefa importante concluída. Isso faz a diferença.',
      'Alta prioridade — e você entregou.',
      'Uma tarefa difícil fora do caminho.',
    ],
    overdue: [
      'Finalmente feito. Você conseguiu.',
      'Atrasada e concluída — isso vale em dobro.',
      'Esta tarefa não vai mais esperar.',
    ],
    fiveTasks: [
      'Já 5 hoje — você está no fluxo.',
      '5 tarefas. Você tem ritmo.',
    ],
    tenTasks: [
      '10 tarefas hoje. Desempenho excepcional.',
      'Dez. É um dia forte.',
    ],
    longOpen: [
      'Esta tarefa estava aberta há muito tempo. Bom que você a enfrentou.',
      'Adiada por muito tempo, agora concluída — isso é ótimo.',
      'Às vezes leva tempo. Mas você conseguiu.',
    ],
  },
};

export function getMotivationalMessage(category: string, lang: Language): string {
  const variants = (messages[lang] ?? messages.de)[category] ?? [];
  if (variants.length === 0) return '';
  return variants[Math.floor(Math.random() * variants.length)];
}
