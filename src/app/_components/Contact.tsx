import { Input } from "~/components/ui/input";
import { InputGroup } from "~/components/ui/input-group";

export function ContactInput() {
  return (
    <form className="w-full max-w-md">
      <div className="rounded-xl bg-white/5 p-6 shadow-md backdrop-blur-sm">
        <h2 className="mb-2 text-lg font-semibold">Your Contact</h2>
        <p className="mb-4 text-sm text-white/70">
          Fill out your contact to automatically sync with friends.
        </p>

        <div className="flex flex-col gap-3">
          <InputGroup>
            <Input
              name="nickname"
              placeholder="Nickname"
              aria-label="Nickname"
            />
          </InputGroup>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <InputGroup>
              <Input
                name="firstName"
                placeholder="First name"
                aria-label="First name"
              />
            </InputGroup>
            <InputGroup>
              <Input
                name="lastName"
                placeholder="Last name"
                aria-label="Last name"
              />
            </InputGroup>
          </div>

          <InputGroup>
            <Input
              name="email"
              type="email"
              placeholder="Email"
              aria-label="Email"
            />
          </InputGroup>

          <div className="mt-2 flex items-center justify-between gap-2">
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-full bg-white/10 px-4 py-2 text-sm font-semibold transition hover:bg-white/20"
            >
              Save contact
            </button>
            <span className="text-xs text-white/60">
              Optional fields can be left blank
            </span>
          </div>
        </div>
      </div>
    </form>
  );
}
