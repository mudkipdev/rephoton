/**
 * Lightweight stand-in for `@tsoa/runtime`, aliased in at build time
 * (see vite.config.ts).
 *
 * `lemmy-js-client`'s generated `LemmyHttp` only pulls in `@tsoa/runtime` for
 * its routing/parameter decorators (`@Post`, `@Body`, `@Inject`, …) and the
 * `Controller` base class. Those decorators are pure server-side spec metadata
 * — the client performs every request through its own `wrapper()`/`upload()`
 * methods, which receive the HTTP verb and path explicitly. None of the
 * decorator metadata is read at runtime.
 *
 * Importing the real package, however, eagerly drags in `reflect-metadata`
 * (~62 kB) plus the `ValidationService` template helpers and all of `validator`
 * (~240 kB) — ~365 kB of dead weight in the startup bundle that every visitor
 * downloads, parses, and executes before the UI is interactive. Replacing it
 * with these no-ops removes that cost entirely while keeping the client's
 * behaviour identical.
 */

/** Minimal mirror of tsoa's `Controller` base class. */
export class Controller {
  private statusCode?: number = undefined
  private headers: Record<string, string | string[] | undefined> = {}

  setStatus(statusCode: number): void {
    this.statusCode = statusCode
  }

  getStatus(): number | undefined {
    return this.statusCode
  }

  setHeader(name: string, value?: string | string[]): void {
    this.headers[name] = value
  }

  getHeader(name: string): string | string[] | undefined {
    return this.headers[name]
  }

  getHeaders(): Record<string, string | string[] | undefined> {
    return this.headers
  }
}

/**
 * A decorator factory whose produced decorator does nothing. Works for class,
 * method, property, and parameter decorators alike, and tolerates being called
 * with any (or no) arguments — covering tsoa's full decorator surface.
 */
const noopDecoratorFactory =
  (..._args: unknown[]) =>
  (..._decoratorArgs: unknown[]): void => undefined

// Routing verbs
export const Get = noopDecoratorFactory
export const Post = noopDecoratorFactory
export const Put = noopDecoratorFactory
export const Patch = noopDecoratorFactory
export const Delete = noopDecoratorFactory
export const Head = noopDecoratorFactory
export const Options = noopDecoratorFactory
export const Route = noopDecoratorFactory

// Parameter decorators
export const Body = noopDecoratorFactory
export const BodyProp = noopDecoratorFactory
export const Query = noopDecoratorFactory
export const Queries = noopDecoratorFactory
export const Path = noopDecoratorFactory
export const Header = noopDecoratorFactory
export const Request = noopDecoratorFactory
export const Inject = noopDecoratorFactory
export const UploadedFile = noopDecoratorFactory
export const UploadedFiles = noopDecoratorFactory
export const FormField = noopDecoratorFactory

// Metadata / documentation decorators
export const Tags = noopDecoratorFactory
export const Security = noopDecoratorFactory
export const NoSecurity = noopDecoratorFactory
export const OperationId = noopDecoratorFactory
export const Deprecated = noopDecoratorFactory
export const Example = noopDecoratorFactory
export const Extension = noopDecoratorFactory
export const Response = noopDecoratorFactory
export const SuccessResponse = noopDecoratorFactory
export const Hidden = noopDecoratorFactory
export const Produces = noopDecoratorFactory
export const Consumes = noopDecoratorFactory
export const Middlewares = noopDecoratorFactory
