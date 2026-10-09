<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Account state is provided once under QueryClientProvider; shared publishing forms persist to Cloud and enforce creation access through database policies. This keeps every creation entry point consistent.
- Account types are stored in a separate protected user_roles table and changed through an authenticated database function, never inferred from client storage. This prevents client-only permission enforcement.
