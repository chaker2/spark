import { createFileRoute } from "@tanstack/react-router";
import { QuizEditor } from "./quiz.new";

export const Route = createFileRoute("/quiz/$id/edit")({
  component: EditWrapper,
  head: () => ({ meta: [{ title: "Modifier le quiz — SPARK" }] }),
});

function EditWrapper() {
  const { id } = Route.useParams();
  return <QuizEditor mode="edit" quizId={id} />;
}
