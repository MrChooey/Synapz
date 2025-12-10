import { useState, useEffect } from "react";
import { useQuery, UseQueryResult, QueryFunction } from "@tanstack/react-query";

export type QuizQuestion = {
	id: number;
	question: string;
	choices: string[];
	answer: number | number[];
	type: "true-false" | "multiple-choice" | "multiple-choice-v2";
	category: string;
	image?: string;
};

export interface QuizState {
	currentQuestionIndex: number;
	selectedAnswers: (number | number[] | null)[];
	answeredQuestions: Set<number>;
	score: number;
	startTime: Date | null;
	endTime: Date | null;
	isCompleted: boolean;
	sessionId: null;
	questions: QuizQuestion[];
}

export function useQuiz(category?: string) {
	const [shuffled, setShuffled] = useState(false);
	const [showCorrectAnswer, setShowCorrectAnswer] = useState(true);
	const [quizState, setQuizState] = useState<QuizState>({
		currentQuestionIndex: 0,
		selectedAnswers: [],
		answeredQuestions: new Set(),
		score: 0,
		startTime: null,
		endTime: null,
		isCompleted: false,
		sessionId: null,
		questions: [],
	});

	const shuffleArray = <T>(arr: T[]): T[] => {
		return [...arr].sort(() => Math.random() - 0.5);
	};

	const queryFn: QueryFunction<QuizQuestion[]> = async () => {
		if (!category || category === "All") {
			const res = await fetch("/quiz-data/categories.json");
			if (!res.ok) throw new Error("Failed to load category list");
			const categoryList: string[] = await res.json();

			const allQuestions: QuizQuestion[] = [];
			for (const file of categoryList) {
				try {
					const qRes = await fetch(`/quiz-data/${file}.json`);
					if (qRes.ok) {
						const data: QuizQuestion[] = await qRes.json();
						allQuestions.push(...data);
					}
				} catch (err) {
					console.error(`Failed to load ${file}.json`, err);
				}
			}
			return allQuestions;
		} else {
			const res = await fetch(`/quiz-data/${category}.json`);
			if (!res.ok) throw new Error("Failed to load questions");
			return res.json();
		}
	};

	const queryResult: UseQueryResult<QuizQuestion[], Error> = useQuery({
		queryKey: ["questions", category],
		queryFn,
	});

	useEffect(() => {
		if (queryResult.data) {
			const prepared = shuffled
				? shuffleArray(queryResult.data)
				: queryResult.data;
			setQuizState((prev) => ({
				...prev,
				questions: prepared,
				selectedAnswers: new Array(prepared.length).fill(null),
			}));
		}
	}, [queryResult.data, shuffled]);

	const startQuiz = () => {
		const startTime = new Date();
		setQuizState((prev) => ({
			...prev,
			startTime,
			currentQuestionIndex: 0,
		}));
	};

	const selectAnswer = (answerIndex: number) => {
		setQuizState((prev) => {
			const q = prev.questions[prev.currentQuestionIndex];
			const updated = [...prev.selectedAnswers];

			if (q?.type === "multiple-choice-v2") {
				const current = Array.isArray(
					updated[prev.currentQuestionIndex]
				)
					? (updated[prev.currentQuestionIndex] as number[])
					: [];
				const exists = current.includes(answerIndex);
				const next = exists
					? current.filter((i) => i !== answerIndex)
					: [...current, answerIndex].sort((a, b) => a - b);
				updated[prev.currentQuestionIndex] = next;
			} else {
				updated[prev.currentQuestionIndex] = answerIndex;
			}

			return { ...prev, selectedAnswers: updated };
		});
	};

	const submitAnswer = () => {
		setQuizState((prev) => {
			const newAnswered = new Set(prev.answeredQuestions);
			newAnswered.add(prev.currentQuestionIndex);
			return { ...prev, answeredQuestions: newAnswered };
		});
	};

	const nextQuestion = () => {
		setQuizState((prev) => {
			const nextIndex = prev.currentQuestionIndex + 1;
			if (nextIndex >= prev.questions.length) return completeQuiz(prev);
			return { ...prev, currentQuestionIndex: nextIndex };
		});
	};

	const previousQuestion = () => {
		setQuizState((prev) => {
			const prevIndex = Math.max(0, prev.currentQuestionIndex - 1);
			const newAnswered = new Set(prev.answeredQuestions);
			// Remove the previous question from answered set to allow re-answering
			newAnswered.delete(prevIndex);
			return {
				...prev,
				currentQuestionIndex: prevIndex,
				answeredQuestions: newAnswered,
			};
		});
	};

	const completeQuiz = (state: QuizState): QuizState => {
		const endTime = new Date();
		const score = calculateScore(state.selectedAnswers, state.questions);
		return {
			...state,
			endTime,
			score,
			isCompleted: true,
		};
	};

	const calculateScore = (
		answers: (number | number[] | null)[],
		questions: QuizQuestion[]
	) => {
		const uniqueSorted = (arr: number[]) => {
			const seen: Record<number, true> = Object.create(null);
			const out: number[] = [];
			for (let i = 0; i < arr.length; i++) {
				const v = arr[i];
				if (seen[v]) continue;
				seen[v] = true;
				out.push(v);
			}
			out.sort((a, b) => a - b);
			return out;
		};

		return answers.reduce((acc: number, ans, i) => {
			const q = questions[i];
			if (!q) return acc;

			if (q.type === "multiple-choice-v2") {
				if (!Array.isArray(ans) || !Array.isArray(q.answer)) return acc;

				const aNorm = uniqueSorted(ans);
				const bNorm = uniqueSorted(q.answer as number[]);

				if (aNorm.length !== bNorm.length) return acc;
				for (let j = 0; j < aNorm.length; j++) {
					if (aNorm[j] !== bNorm[j]) return acc;
				}
				return acc + 1;
			} else {
				if (
					typeof ans === "number" &&
					typeof q.answer === "number" &&
					ans === q.answer
				) {
					return acc + 1;
				}
				return acc;
			}
		}, 0);
	};

	const resetQuiz = () => {
		let resetQuestions = queryResult.data ?? [];
		if (shuffled) resetQuestions = shuffleArray(resetQuestions);
		setQuizState({
			currentQuestionIndex: 0,
			selectedAnswers: new Array(resetQuestions.length).fill(null),
			answeredQuestions: new Set(),
			score: 0,
			startTime: null,
			endTime: null,
			isCompleted: false,
			sessionId: null,
			questions: resetQuestions,
		});
	};

	const submitQuiz = () => {
		setQuizState((prev) => completeQuiz(prev));
	};

	const toggleShuffle = () => setShuffled((prev) => !prev);

	const toggleShowCorrectAnswer = () => setShowCorrectAnswer((prev) => !prev);

	const shuffleChoices = () => {
		const updatedQuestions = quizState.questions.map((q) => {
			const perm = q.choices.map((_, idx) => idx);
			const shuffledPerm = shuffleArray(perm);
			const newChoices = shuffledPerm.map((oldIdx) => q.choices[oldIdx]);

			let newAnswer: number | number[];
			if (Array.isArray(q.answer)) {
				// For each old correct index, find its new index position in the permutation
				newAnswer = q.answer
					.map((oldIdx) => shuffledPerm.indexOf(oldIdx))
					.sort((a, b) => a - b);
			} else {
				newAnswer = shuffledPerm.indexOf(q.answer);
			}

			return { ...q, choices: newChoices, answer: newAnswer };
		});

		setQuizState((prev) => ({
			...prev,
			questions: updatedQuestions,
			selectedAnswers: new Array(updatedQuestions.length).fill(null),
			answeredQuestions: new Set(),
			currentQuestionIndex: 0,
		}));
	};

	const currentSelection =
		quizState.selectedAnswers[quizState.currentQuestionIndex];
	const canGoNext =
		quizState.questions.length === 0
			? false
			: Array.isArray(currentSelection)
			? currentSelection.length > 0
			: currentSelection !== null;

	const isCurrentQuestionAnswered = quizState.answeredQuestions.has(
		quizState.currentQuestionIndex
	);

	return {
		quizState,
		questions: quizState.questions,
		isLoading: queryResult.isLoading,
		currentQuestion:
			quizState.questions[quizState.currentQuestionIndex] || null,
		progress:
			quizState.questions.length === 0
				? 0
				: Math.round(
						(quizState.currentQuestionIndex /
							quizState.questions.length) *
							100
				  ),
		selectedAnswer: currentSelection ?? null,
		startQuiz,
		selectAnswer,
		submitAnswer,
		nextQuestion,
		previousQuestion,
		resetQuiz,
		submitQuiz,
		canGoPrevious: quizState.currentQuestionIndex > 0,
		canGoNext,
		isLastQuestion:
			quizState.currentQuestionIndex === quizState.questions.length - 1,
		isCurrentQuestionAnswered,
		shuffleChoices,
		toggleShuffle,
		toggleShowCorrectAnswer,
		shuffled,
		showCorrectAnswer,
	};
}
