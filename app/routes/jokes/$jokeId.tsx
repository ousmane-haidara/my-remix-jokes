import type { LoaderFunction, MetaFunction, } from "remix";
import type { Joke } from "@prisma/client";
import { json, Link, useLoaderData, useParams, useCatch, } from "remix";
import { db } from "~/utils/db.server";
import {
  getUserId,
  requireUserId,
} from "~/utils/session.server";

export const meta: MetaFunction = ({
  data,
}: {
  data: LoaderData | undefined;
}) => {
  if (!data) {
    return {
      title: "No joke",
      description: "No joke found",
    };
  }
  return {
    title: `"${data.joke.name}" joke`,
    description: `Enjoy the "${data.joke.name}" joke and much more`,
  };
};

type LoaderData = { joke: Joke; isOwner: boolean };

export const loader: LoaderFunction = async ({
  params,
  request
}) => {
  const userId = await getUserId(request);
  const joke = await db.joke.findUnique({
    where: { id: params.jokeId },
  });
  if (!joke) {
    throw new Response("What a joke! Not found.", {
      status: 404,
    });
  }
  const data: LoaderData = { joke, isOwner: userId === joke.jokesterId, };
  return json(data);
};

export default function JokeRoute() {
  const data = useLoaderData<LoaderData>();

  return (
    <div>
      <p>Here's your hilarious joke:</p>
      <p>{data.joke.content}</p>
      <Link to=".">{data.joke.name} Permalink</Link>
      {data.isOwner ? (
        <form method="post">
          <input
            type="hidden"
            name="_method"
            value="delete"
          />
          <button type="submit" className="button">
            Delete
          </button>
        </form>
      ) : null}
    </div>
  );
}

export function CatchBoundary() {
  const caught = useCatch();
  const params = useParams();
  if (caught.status === 404) {
    return (
      <div className="error-container">
        Huh? What the heck is "{params.jokeId}"?
      </div>
    );
  }
  throw new Error(`Unhandled error: ${caught.status}`);
}

export function ErrorBoundary() {
  const { jokeId } = useParams();
  return (
    <div className="error-container">{`There was an error loading joke by the id ${jokeId}. Sorry.`}</div>
  );
}
