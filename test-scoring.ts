import { generateAssessmentBank, generateApplicantVariant } from './lib/assessmentEngine';

const ctx = {
  title: "Security Analyst",
  department: "Security",
  description: "Looking for someone to do pentesting.",
  requirements: "OSCP",
  experienceLevel: "Entry Level",
  niceToHave: "",
  type: "Job"
};
const settings = { mcqCount: 2, openCount: 0 };

const { assessmentBank, answerKey } = generateAssessmentBank(ctx, settings);
const variant = generateApplicantVariant(assessmentBank, answerKey, settings);

const candidateAnswers = {
  [variant.applicantQuestions[0].id]: "0",
  [variant.applicantQuestions[1].id]: "1"
};

const sessionAnswerKey = variant.applicantAnswers;

const results = variant.applicantQuestions.map((q: any) => {
  const answer = candidateAnswers[q.id];
  const keyEntry = sessionAnswerKey.find((k: any) => k.questionId === q.id) || {} as any;
  
  let score = 0;
  if (q.type === "mcq") {
    const correct = parseInt(answer) === keyEntry.correctOption;
    score = correct ? q.points : 0;
    console.log(`Q: ${q.prompt}`);
    console.log(`User Answer: ${answer}, Correct: ${keyEntry.correctOption}`);
    console.log(`Score: ${score} / ${q.points}`);
  }
  return score;
});

const totalScore = results.reduce((a, b) => a + b, 0);
console.log(`Total Score: ${totalScore}`);
