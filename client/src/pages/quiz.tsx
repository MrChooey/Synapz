import { useState } from "react";
import { useLocation } from "wouter";
import { useQuiz } from "@/hooks/use-quiz";
import { QuizHeader } from "@/components/quiz/quiz-header";
import { ProgressIndicator } from "@/components/quiz/progress-indicator";
import { QuestionCard } from "@/components/quiz/question-card";
import { NavigationControls } from "@/components/quiz/navigation-controls";
import { QuizResults } from "@/components/quiz/quiz-results";
import { StatsSidebar } from "@/components/quiz/stats-sidebar";
import { ReviewAnswers } from "@/pages/review";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Home, Shuffle, Eye, EyeOff } from "lucide-react";

export default function Quiz() {
	const [, setLocation] = useLocation();
	const [showReview, setShowReview] = useState(false);

	const urlParams = new URLSearchParams(window.location.search);
	const category = urlParams.get("category") || undefined;
	const categoryDisplay = category || "All Categories";

	const {
		quizState,
		questions,
		isLoading,
		currentQuestion,
		progress,
		selectedAnswer,
		startQuiz,
		selectAnswer,
		submitAnswer,
		nextQuestion,
		previousQuestion,
		resetQuiz,
		submitQuiz,
		canGoPrevious,
		canGoNext,
		isLastQuestion,
		isCurrentQuestionAnswered,
		shuffleChoices,
		toggleShuffle,
		toggleShowCorrectAnswer,
		shuffled,
		showCorrectAnswer,
	} = useQuiz(category);

	const handleSubmitAnswer = () => {
		if (showCorrectAnswer) {
			// Show the answer and wait for user to click next
			submitAnswer();
		} else {
			// Auto-advance to next question without showing answer
			submitAnswer();
			nextQuestion();
		}
	};

	const goHome = () => setLocation("/");

	const handleRetake = () => {
		setShowReview(false);
		resetQuiz();
	};

	const handleReview = () => {
		setShowReview(true);
	};

	if (isLoading) {
		return (
			<div className="min-h-screen bg-slate-50">
				<QuizHeader category={categoryDisplay} />
				<main className="max-w-4xl mx-auto px-4 py-8">
					<Card>
						<CardContent className="p-8 text-center">
							<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
							<p className="text-slate-600">Loading quiz...</p>
						</CardContent>
					</Card>
				</main>
			</div>
		);
	}

	if (!quizState.startTime) {
		return (
			<div className="min-h-screen bg-slate-50">
				<QuizHeader category={categoryDisplay} />
				<main className="max-w-4xl mx-auto px-4 py-8">
					<Card>
						<CardContent className="p-8 text-center">
							<div className="mb-6">
								<div className="bg-blue-100 text-blue-600 rounded-full p-4 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
									<Play className="w-8 h-8" />
								</div>
								<h2 className="text-3xl font-bold text-slate-800 mb-2">
									Ready to Start?
								</h2>
								<p className="text-slate-600 mb-4">
									Test your knowledge with {questions.length}{" "}
									questions{" "}
									{category
										? `about ${category}`
										: "from all categories"}
								</p>
								<div className="text-sm text-slate-500 mb-6">
									Take your time and choose the best answer
									for each question
								</div>
							</div>
							<div className="space-y-3">
								<Button
									onClick={startQuiz}
									size="lg"
									className="px-8"
								>
									<Play className="w-4 h-4 mr-2" />
									Start Quiz
								</Button>

								<div className="flex flex-wrap justify-center gap-3">
									<Button
										variant="outline"
										onClick={goHome}
										size="sm"
									>
										<Home className="w-4 h-4 mr-2" />
										Go Home
									</Button>

									<Button
										variant={
											shuffled ? "default" : "outline"
										}
										onClick={toggleShuffle}
										size="sm"
									>
										<Shuffle className="w-4 h-4 mr-2" />
										{shuffled
											? "Shuffling On"
											: "Shuffle Questions"}
									</Button>

									<Button
										variant="outline"
										onClick={shuffleChoices}
										size="sm"
										title="Shuffle choices for all questions"
									>
										<Shuffle className="w-4 h-4 mr-2" />
										Shuffle Choices
									</Button>

									<Button
										variant={
											showCorrectAnswer
												? "default"
												: "outline"
										}
										onClick={toggleShowCorrectAnswer}
										size="sm"
									>
										{showCorrectAnswer ? (
											<Eye className="w-4 h-4 mr-2" />
										) : (
											<EyeOff className="w-4 h-4 mr-2" />
										)}
										{showCorrectAnswer
											? "Show Answers"
											: "Hide Answers"}
									</Button>
								</div>
							</div>
						</CardContent>
					</Card>
				</main>
			</div>
		);
	}

	if (quizState.isCompleted) {
		if (showReview) {
			return (
				<ReviewAnswers
					questions={questions}
					userAnswers={quizState.selectedAnswers}
					score={quizState.score}
					onRetake={handleRetake}
					onHome={goHome}
				/>
			);
		}

		return (
			<div className="min-h-screen bg-slate-50">
				<QuizHeader category={categoryDisplay} />
				<main className="max-w-4xl mx-auto px-4 py-8">
					<QuizResults
						score={quizState.score}
						totalQuestions={questions.length}
						onRetake={handleRetake}
						onReview={handleReview}
						onHome={goHome}
					/>
				</main>
			</div>
		);
	}

	if (!currentQuestion) {
		return (
			<div className="min-h-screen bg-slate-50">
				<QuizHeader category={categoryDisplay} />
				<main className="max-w-4xl mx-auto px-4 py-8">
					<Card>
						<CardContent className="p-8 text-center">
							<p className="text-slate-600 mb-4">
								No questions available
							</p>
							<Button onClick={goHome}>
								<Home className="w-4 h-4 mr-2" />
								Go Home
							</Button>
						</CardContent>
					</Card>
				</main>
			</div>
		);
	}

	const isMultiSelect = currentQuestion.type === "multiple-choice-v2";

	return (
		<div className="min-h-screen bg-slate-50">
			<QuizHeader category={categoryDisplay} />

			<main className="max-w-4xl mx-auto px-4 py-8">
				<ProgressIndicator
					currentQuestion={quizState.currentQuestionIndex}
					totalQuestions={questions.length}
					category={currentQuestion.category}
				/>

				<QuestionCard
					question={currentQuestion}
					selectedAnswer={selectedAnswer}
					onSelectAnswer={selectAnswer}
					multiSelect={isMultiSelect}
					isAnswered={isCurrentQuestionAnswered}
					showCorrectAnswer={showCorrectAnswer}
				/>

				{!isCurrentQuestionAnswered ? (
					<div className="mt-6 flex gap-3">
						<Button
							onClick={previousQuestion}
							disabled={!canGoPrevious}
							variant="outline"
							size="lg"
							className="px-8 py-3 text-base font-bold rounded-xl"
						>
							Previous
						</Button>
						<Button
							onClick={handleSubmitAnswer}
							disabled={selectedAnswer === null}
							size="lg"
							className="px-8 py-3 text-base font-bold rounded-xl shadow-md hover:opacity-90 transition flex-1"
						>
							Submit Answer
						</Button>
					</div>
				) : (
					<div className="mt-6 flex gap-3">
						<Button
							onClick={previousQuestion}
							disabled={!canGoPrevious}
							variant="outline"
							size="lg"
							className="px-8 py-3 text-base font-bold rounded-xl"
						>
							Previous
						</Button>
						<Button
							onClick={nextQuestion}
							disabled={isLastQuestion}
							size="lg"
							className="px-8 py-3 text-base font-bold rounded-xl shadow-md hover:opacity-90 transition flex-1"
						>
							{isLastQuestion ? "View Results" : "Next Question"}
						</Button>
					</div>
				)}

				<div className="mt-8 flex justify-end">
					<Button
						variant="destructive"
						onClick={submitQuiz}
						size="lg"
						className="px-8 py-3 text-base font-bold rounded-xl shadow-md hover:opacity-90 transition"
					>
						Submit Quiz Early
					</Button>
				</div>
			</main>

			<StatsSidebar
				startTime={quizState.startTime}
				questionsRemaining={
					questions.length - quizState.currentQuestionIndex - 1
				}
				currentStreak={0}
				category={currentQuestion.category}
				progress={progress}
			/>
		</div>
	);
}
