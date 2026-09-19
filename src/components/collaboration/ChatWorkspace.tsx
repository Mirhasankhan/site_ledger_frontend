"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, MessageCircle, Send, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  useListProjectsQuery,
  useListWorkersQuery,
} from "@/redux/features/projects/projectApi";
import {
  useCreateRoomMutation,
  useGetProjectMessagesQuery,
  useGetRoomMessagesQuery,
  useGetRoomsQuery,
  useSendDirectMessageMutation,
  useSendProjectMessageMutation,
} from "@/redux/features/collaboration/collaborationApi";

const schema = z.object({
  content: z.string().min(1, "Write a message first"),
});
type Values = z.infer<typeof schema>;

export default function ChatWorkspace({
  role,
}: {
  role: "ADMIN" | "SITE_MANAGER" | "WORKER";
}) {
  const { data: projectsData } = useListProjectsQuery("");
  const projects = useMemo(
    () => projectsData?.data ?? [],
    [projectsData?.data],
  );
  const { data: workersData } = useListWorkersQuery("limit=100");
  const workers = workersData?.data ?? [];
  const { data: roomsData } = useGetRoomsQuery();
  const [mode, setMode] = useState<"project" | "direct">("project");
  const [projectId, setProjectId] = useState("");
  const [roomId, setRoomId] = useState("");
  const [actionError, setActionError] = useState("");
  const {
    data: projectMessagesData,
    isLoading: projectLoading,
    isError: projectError,
  } = useGetProjectMessagesQuery(
    { projectId },
    { skip: mode !== "project" || !projectId },
  );
  const {
    data: roomMessagesData,
    isLoading: roomLoading,
    isError: roomError,
  } = useGetRoomMessagesQuery(
    { roomId },
    { skip: mode !== "direct" || !roomId },
  );
  const [createRoom, { isLoading: creatingRoom }] = useCreateRoomMutation();
  const [sendProjectMessage, { isLoading: sendingProject }] =
    useSendProjectMessageMutation();
  const [sendDirectMessage, { isLoading: sendingDirect }] =
    useSendDirectMessageMutation();
  const canStartDirect = role !== "WORKER" || workers.length > 0;
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<Values>({ resolver: zodResolver(schema) });
  const rooms = roomsData?.data ?? [];
  const messages =
    mode === "project"
      ? (projectMessagesData?.data ?? [])
      : (roomMessagesData?.data ?? []);
  const onSend = async (values: Values) => {
    try {
      if (mode === "project" && projectId)
        await sendProjectMessage({ projectId, body: values }).unwrap();
      else if (mode === "direct" && roomId)
        await sendDirectMessage({ roomId, body: values }).unwrap();
      reset();
    } catch (error) {
      setError("content", {
        message:
          (error as { data?: { message?: string } })?.data?.message ||
          "Message could not be sent.",
      });
    }
  };
  useEffect(() => {
    if (!projectId && projects[0]?.id) setProjectId(projects[0].id);
  }, [projectId, projects]);
  return (
    <div className="space-y-7">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-600">
          Collaboration
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Messages</h1>
        <p className="mt-2 text-slate-500">
          Keep project conversations and direct messages in one place.
        </p>
      </div>
      <div className="flex gap-2">
        <button
          className={mode === "project" ? "btn-primary" : "btn-secondary"}
          onClick={() => setMode("project")}
        >
          <Users size={17} />
          Project chat
        </button>
        <button
          className={mode === "direct" ? "btn-primary" : "btn-secondary"}
          onClick={() => setMode("direct")}
        >
          <MessageCircle size={17} />
          Direct messages
        </button>
      </div>
      {mode === "project" ? (
        <div>
          <label className="form-label" htmlFor="chat-project">
            Project
          </label>
          <select
            id="chat-project"
            className="form-input max-w-md"
            value={projectId}
            onChange={(event) => setProjectId(event.target.value)}
          >
            <option value="">Select project</option>
            {projects.map((project: any) => (
              <option key={project.id} value={project.id}>
                {project.projectName}
              </option>
            ))}
          </select>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="form-label" htmlFor="room">
              Conversation
            </label>
            <select
              id="room"
              className="form-input"
              value={roomId}
              onChange={(event) => setRoomId(event.target.value)}
            >
              <option value="">Select conversation</option>
              {rooms.map((room: any) => (
                <option key={room.id} value={room.id}>
                  {room.user1?.userName ||
                    room.user2?.userName ||
                    "Direct message"}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="form-label" htmlFor="receiver">
              Start a conversation
            </label>
            <select
              id="receiver"
              className="form-input"
              defaultValue=""
              disabled={creatingRoom || !canStartDirect}
              onChange={async (event) => {
                if (!event.target.value) return;
                setActionError("");
                try {
                  const result = await createRoom({
                    receiverId: event.target.value,
                  }).unwrap();
                  setRoomId(result.data.id);
                } catch (error) {
                  setActionError(
                    (error as { data?: { message?: string } })?.data?.message ||
                    "Conversation could not be opened.",
                  );
                }
              }}
            >
              <option value="">Choose a worker</option>
              {workers.map((worker: any) => (
                <option key={worker.workerId} value={worker.workerId}>
                  {worker.worker?.userName || worker.workerId}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
      {actionError && (
        <div className="rounded-[6px] bg-red-50 px-4 py-3 text-sm text-red-700">
          {actionError}
        </div>
      )}
      <section className="card-surface flex min-h-[28rem] flex-col overflow-hidden rounded-[9px]">
        <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50 p-5">
          {(mode === "project" ? projectLoading : roomLoading) ? (
            <div className="h-32 animate-pulse rounded bg-slate-200" />
          ) : (mode === "project" ? projectError : roomError) ? (
            <div className="flex h-40 items-center justify-center gap-2 text-sm text-red-700">
              <AlertCircle size={18} />
              Messages could not be loaded.
            </div>
          ) : (!projectId && mode === "project") ||
            (!roomId && mode === "direct") ? (
            <div className="flex h-40 items-center justify-center text-sm text-slate-500">
              Choose a conversation to begin.
            </div>
          ) : messages.length === 0 ? (
            <div className="flex h-40 items-center justify-center text-sm text-slate-500">
              No messages yet. Start the conversation.
            </div>
          ) : (
            messages.map((message: any) => (
              <div
                key={message.id}
                className={`max-w-xl rounded-[9px] border border-slate-200 bg-white p-3 shadow-sm ${message.isSystem ? "border-amber-200 bg-amber-50" : ""}`}
              >
                <p className="text-sm leading-6">{message.content}</p>
                <p className="mt-1 text-[11px] text-slate-400">
                  {new Date(message.createdAt).toLocaleString()}
                </p>
              </div>
            ))
          )}
        </div>
        <form
          onSubmit={handleSubmit(onSend)}
          className="flex gap-3 border-t border-slate-200 bg-white p-4"
        >
          <input
            className="form-input"
            placeholder="Write a message"
            {...register("content")}
          />
          {errors.content && (
            <p className="form-error">{errors.content.message}</p>
          )}
          <button
            className="btn-primary shrink-0"
            type="submit"
            disabled={
              sendingProject ||
              sendingDirect ||
              (mode === "project" ? !projectId : !roomId)
            }
          >
            <Send size={17} />
            Send
          </button>
        </form>
      </section>
    </div>
  );
}
