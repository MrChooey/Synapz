import { HelpCircle, Tag, List } from "lucide-react";

type QuizQuestion = {
	id: number;
	question: string;
	choices: string[];
	answer: number | number[];
	type: "true-false" | "multiple-choice" | "multiple-choice-v2";
	category: string;
	image?: string;
};

interface QuestionCardProps {
	question: QuizQuestion;
	selectedAnswer: number | number[] | null;
	onSelectAnswer: (answerIndex: number) => void;
	multiSelect?: boolean;
	isAnswered?: boolean;
	showCorrectAnswer?: boolean;
}

export function QuestionCard({
	question,
	selectedAnswer,
	onSelectAnswer,
	multiSelect,
	isAnswered,
	showCorrectAnswer = true,
}: QuestionCardProps) {
	const isMulti =
		typeof multiSelect === "boolean"
			? multiSelect
			: question.type === "multiple-choice-v2";

	const isIndexSelected = (idx: number) => {
		if (isMulti) {
			return Array.isArray(selectedAnswer)
				? selectedAnswer.includes(idx)
				: false;
		}
		return typeof selectedAnswer === "number"
			? selectedAnswer === idx
			: false;
	};

	return (
		<div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 mb-6 animate-slide-in">
			{/* Header */}
			<div className="mb-8">
				<div className="flex items-start space-x-4">
					<div className="bg-blue-50 text-blue-600 rounded-full p-3 flex-shrink-0">
						<HelpCircle className="w-6 h-6" />
					</div>
					<div className="flex-1">
						<h2 className="text-2xl font-semibold text-slate-800 leading-relaxed mb-4">
							{question.question}
						</h2>
						<div className="flex items-center space-x-4 text-sm text-slate-500">
							<span className="flex items-center space-x-1">
								<Tag className="w-4 h-4" />
								<span>{question.category}</span>
							</span>
							<span className="flex items-center space-x-1">
								<List className="w-4 h-4" />
								<span className="capitalize">
									{question.type === "multiple-choice-v2"
										? "multiple/answers"
										: question.type.replace("-", "/")}
								</span>
							</span>
						</div>
					</div>
				</div>
			</div>

			{/* Optional Image */}
			{question.image && (
				<div className="mb-6">
					<figure className="rounded-lg border border-slate-200 overflow-hidden bg-slate-50">
						<img
							src={question.image}
							alt=""
							loading="lazy"
							className="w-full h-auto object-contain"
						/>
					</figure>
				</div>
			)}

			{/* Choices */}
			<div className="space-y-3">
				{question.choices.map((choice, index) => {
					const isSelected = isIndexSelected(index);
					const isCorrectAnswer = Array.isArray(question.answer)
						? question.answer.includes(index)
						: question.answer === index;
					const showAsCorrect =
						isAnswered && showCorrectAnswer && isCorrectAnswer;
					const showAsIncorrect =
						isAnswered &&
						showCorrectAnswer &&
						isSelected &&
						!isCorrectAnswer;
					const inputId = `choice-${question.id}-${index}`;

					return (
						<label
							key={index}
							htmlFor={inputId}
							className={`flex items-center p-4 rounded-lg border-2 transition-all ${
								showAsCorrect
									? "border-green-500 bg-green-50 cursor-not-allowed"
									: showAsIncorrect
									? "border-red-500 bg-red-50 cursor-not-allowed"
									: isSelected && !isAnswered
									? "border-blue-500 bg-blue-50 cursor-pointer"
									: "border-slate-200 hover:border-blue-300 hover:bg-blue-50 cursor-pointer"
							} ${isAnswered ? "cursor-not-allowed" : "group"}`}
						>
							{/* Hidden Input */}
							<input
								id={inputId}
								name={`question-${question.id}${
									isMulti ? "-multi" : ""
								}`}
								type={isMulti ? "checkbox" : "radio"}
								value={index}
								checked={isSelected}
								onChange={() =>
									!isAnswered && onSelectAnswer(index)
								}
								disabled={isAnswered}
								className="sr-only"
							/>

							<div className="flex items-center space-x-4 w-full">
								{/* Selector icon */}
								{isMulti ? (
									<div
										className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${
											showAsCorrect
												? "border-green-500 bg-green-500"
												: showAsIncorrect
												? "border-red-500 bg-red-500"
												: isSelected && !isAnswered
												? "border-blue-500 bg-blue-500"
												: "border-slate-300 group-hover:border-blue-500"
										}`}
									>
										{/* check mark or x mark */}
										{showAsCorrect ||
										(isSelected && !isAnswered) ? (
											<svg
												className="w-3 h-3 text-white"
												viewBox="0 0 20 20"
												fill="currentColor"
											>
												<path
													fillRule="evenodd"
													d="M16.707 5.293a1 1 0 010 1.414l-7.364 7.364a1 1 0 01-1.414 0L3.293 9.435a1 1 0 111.414-1.414l3.05 3.05 6.657-6.657a1 1 0 011.293-.121z"
													clipRule="evenodd"
												/>
											</svg>
										) : showAsIncorrect ? (
											<svg
												className="w-3 h-3 text-white"
												viewBox="0 0 20 20"
												fill="currentColor"
											>
												<path
													fillRule="evenodd"
													d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
													clipRule="evenodd"
												/>
											</svg>
										) : null}
									</div>
								) : (
									<div
										className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
											showAsCorrect
												? "border-green-500"
												: showAsIncorrect
												? "border-red-500"
												: isSelected && !isAnswered
												? "border-blue-500"
												: "border-slate-300 group-hover:border-blue-500"
										}`}
									>
										<div
											className={`w-3 h-3 rounded-full transition-opacity ${
												showAsCorrect
													? "bg-green-500"
													: showAsIncorrect
													? "bg-red-500"
													: isSelected && !isAnswered
													? "bg-blue-500 opacity-100"
													: "bg-blue-500 opacity-0 group-hover:opacity-100"
											}`}
										/>
									</div>
								)}

								{/* Answer Text */}
								<span
									className={`text-lg transition-colors flex-1 ${
										showAsCorrect
											? "text-green-700 font-medium"
											: showAsIncorrect
											? "text-red-700 font-medium"
											: isSelected && !isAnswered
											? "text-slate-900 font-medium"
											: "text-slate-700 group-hover:text-slate-900"
									}`}
								>
									{choice}
								</span>

								{/* Correct/Incorrect badges */}
								{showAsCorrect && isSelected && (
									<span className="ml-2 px-3 py-1 bg-green-200 text-green-700 text-sm font-medium rounded-full">
										✓ Your Answer (Correct)
									</span>
								)}
								{showAsCorrect && !isSelected && (
									<span className="ml-2 px-3 py-1 bg-green-200 text-green-700 text-sm font-medium rounded-full">
										✓ Correct Answer
									</span>
								)}
								{showAsIncorrect && (
									<span className="ml-2 px-3 py-1 bg-red-200 text-red-700 text-sm font-medium rounded-full">
										✗ Your Answer
									</span>
								)}
							</div>
						</label>
					);
				})}
			</div>
		</div>
	);
}
