(() => {
const menu = document.querySelector('.nav-toggle');
const links = document.querySelector('.nav-links');
if (matchMedia('(max-width:650px)').matches) document.querySelector('.flow-nav .active')?.scrollIntoView({ block: 'nearest', inline: 'center' });
menu.addEventListener('click', () => {
  const open = menu.getAttribute('aria-expanded') !== 'true';
  menu.setAttribute('aria-expanded', String(open));
  links.classList.toggle('open', open);
});

const form = document.getElementById('pilot-form');
const invalidateResults = () => {
  sessionStorage.removeItem('north-star-skills-complete');
  sessionStorage.removeItem('north-star-results-complete');
  window.updateJourney?.();
};
form.addEventListener('input', invalidateResults);
form.addEventListener('change', invalidateResults);
const [quizSection, tasksSection, codingSection] = form.querySelectorAll(':scope > section');
const quiz = document.getElementById('quiz');
const skillHeadings = [...quiz.querySelectorAll('.skill-group-heading')];
const questions = [...quiz.querySelectorAll('fieldset')];
const scenarios = [...document.querySelectorAll('#tasks > section')];
const pager = document.getElementById('assessment-pager');
const back = document.getElementById('stage-back');
const next = document.getElementById('stage-next');
const stageLabel = document.getElementById('stage-label');
const stageFill = document.getElementById('stage-fill');
const feedbackPanel = document.getElementById('practice-feedback');
const reviewParts = [...form.children].filter(element => ![quizSection, tasksSection, codingSection, pager, feedbackPanel].includes(element));
const stages = [
  ...questions.map((_, index) => ({ kind: 'quiz', title: `Knowledge check · ${skillHeadings[Math.floor(index / 5)].textContent}`, index })),
  ...scenarios.map((_, index) => ({ kind: 'scenarios', title: 'Practical scenario', index })),
  { kind: 'coding', title: 'JavaScript coding task' },
  { kind: 'review', title: 'Review your work' }
];
const stageKey = 'pathfinder-skills-stage-v3';
const storedStage = Number(sessionStorage.getItem(stageKey));
const stageError = document.createElement('p');
stageError.className = 'error';
stageError.setAttribute('role', 'alert');
stageError.hidden = true;
function missingForStage(index) {
  const stage = stages[index];
  if (stage.kind === 'quiz') return questions[stage.index].querySelector('input:checked') ? [] : [questions[stage.index]];
  if (stage.kind === 'scenarios') return scenarios[stage.index].querySelector('textarea').value.trim() ? [] : [scenarios[stage.index]];
  if (stage.kind === 'coding') {
    let saved = {};
    try { saved = JSON.parse(sessionStorage.getItem('pathfinder-research-pilot-v0-1')) || {}; } catch { /* Invalid saved work remains incomplete. */ }
    return saved.coding?.lastRun && saved.coding.code?.trim() ? [] : [document.getElementById('code-editor')];
  }
  return [];
}
const firstIncomplete = stages.findIndex((_, index) => missingForStage(index).length);
let currentStage = Number.isInteger(storedStage) && storedStage >= 0 && storedStage < stages.length ? Math.min(storedStage, firstIncomplete < 0 ? stages.length - 1 : firstIncomplete) : 0;

function showStage(index, moveFocus = false) {
  currentStage = index;
  sessionStorage.setItem(stageKey, String(index));
  const stage = stages[index];
  quizSection.hidden = stage.kind !== 'quiz';
  tasksSection.hidden = stage.kind !== 'scenarios';
  codingSection.hidden = stage.kind !== 'coding';
  reviewParts.forEach(part => { part.hidden = stage.kind !== 'review'; });
  feedbackPanel.hidden = stage.kind !== 'review' || feedbackPanel.dataset.opened !== 'true';
  skillHeadings.forEach(heading => { heading.hidden = true; });
  questions.forEach((question, questionIndex) => { question.hidden = stage.kind !== 'quiz' || questionIndex !== stage.index; });
  scenarios.forEach((scenario, scenarioIndex) => { scenario.hidden = stage.kind !== 'scenarios' || scenarioIndex !== stage.index; });
  if (stage.kind === 'quiz') updateQuizProgress();
  stageLabel.textContent = stage.title;
  document.getElementById('stage-count').textContent = stage.kind === 'quiz' ? `Question ${stage.index + 1} of ${questions.length}` : stage.kind === 'scenarios' ? `Scenario ${stage.index + 1} of ${scenarios.length}` : `Step ${index + 1} of ${stages.length}`;
  stageFill.style.transform = `scaleX(${(index + 1) / stages.length})`;
  stageFill.parentElement.setAttribute('aria-valuemax', String(stages.length));
  stageFill.parentElement.setAttribute('aria-valuenow', String(index + 1));
  back.hidden = index === 0;
  next.hidden = index === stages.length - 1;
  next.textContent = index === stages.length - 2 ? 'Review your work →' : 'Next →';
  if (stage.kind === 'review') form.append(pager);
  else (stage.kind === 'quiz' ? quizSection : stage.kind === 'scenarios' ? tasksSection : codingSection).after(pager);
  form.prepend(stageError);
  stageError.hidden = true;
  if (moveFocus) {
    stageLabel.scrollIntoView({ block: 'start', behavior: 'auto' });
    stageLabel.focus({ preventScroll: true });
  }
}

function updateQuizProgress() {
  const answered = questions.filter(question => question.querySelector('input:checked')).length;
  document.getElementById('quiz-progress').textContent = `${answered} of ${questions.length} knowledge questions answered`;
}

stageLabel.tabIndex = -1;
quiz.addEventListener('change', updateQuizProgress);
back.addEventListener('click', () => showStage(currentStage - 1, true));
next.addEventListener('click', () => {
  const missing = missingForStage(currentStage);
  if (missing.length) {
    stageError.textContent = stages[currentStage].kind === 'quiz' ? 'Choose an answer before continuing.' : stages[currentStage].kind === 'scenarios' ? 'Write a response before continuing.' : 'Edit your code and run the sample checks before continuing.';
    stageError.hidden = false;
    (missing[0].querySelector('input,textarea') || missing[0]).focus();
    return;
  }
  showStage(currentStage + 1, true);
});
showStage(currentStage);
})();
