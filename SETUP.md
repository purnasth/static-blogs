# Setup guide

**For someone who has never done this before.** No prior coding needed. Follow
it top to bottom, in order, and don't skip a step because it looks unimportant.

It takes about **30–40 minutes** the first time. After that, publishing a new
post takes about a minute.

> Already a developer? [DEVELOPING.md](./DEVELOPING.md) has the same ground in a
> tenth of the words.

---

## Contents

| Part | What you do | Time |
| --- | --- | --- |
| [0](#part-0--the-idea-in-a-minute) | Understand what you're setting up | 1 min |
| [1](#part-1--install-the-three-tools) | Install Node.js, pnpm and Git | 15 min |
| [2](#part-2--github) | Make a GitHub account and download the blog | 10 min |
| [3](#part-3--run-the-blog-on-your-computer) | Start it up and see it | 5 min |
| [4](#part-4--write-and-publish-a-post) | Write your first post and put it online | 10 min |
| [5](#part-5--deploy-it-to-the-internet-once-only) | Connect it to Cloudflare | 15 min |
| [6](#part-6--your-everyday-routine) | The 5-line cheat sheet you'll actually use | — |
| [7](#part-7--when-something-goes-wrong) | Fixes for the usual problems | — |

---

## Part 0 — The idea in a minute

This blog has no admin website to log into, no password, and no database. That
sounds strange, so here is the shape of it:

1. You write posts **on your own computer**, in a small writing app that only
   runs there.
2. When you're happy, you press one button. Your writing is uploaded to
   **GitHub** (a free storage service for files like these).
3. **Cloudflare** notices the new file, rebuilds the website automatically, and
   the post is live about a minute later.

So the three tools you're about to install are just: something to run the
writing app (**Node.js**), something to fetch the pieces it needs
(**pnpm**), and something to upload your work (**Git**).

Nothing you install here can be seen by visitors to your blog.

---

## Part 1 — Install the three tools

### 1.1 First, open the Terminal

Most of this guide is typing short lines into a black window. That window is
called the **Terminal**.

**On a Mac:** press `⌘ + Space`, type `Terminal`, press Enter.

**On Windows:** press the Start button, type `PowerShell`, and click
**Windows PowerShell**.

A window opens with a blinking cursor. That's it. You type one line, press
**Enter**, and wait for it to finish before typing the next.

> **How to read this guide.** Anything in a grey box is meant to be typed (or
> pasted) into that window, one line at a time. You can paste with `⌘V` on a
> Mac or right-click on Windows.
>
> When a command finishes it usually prints nothing at all. **Silence means it
> worked.** Red text means something went wrong — see [Part 7](#part-7--when-something-goes-wrong).

### 1.2 Install Node.js

Node.js is the engine that runs the writing app.

1. Go to **<https://nodejs.org>**
2. Download the big green button marked **LTS** (it will say something like
   "22.x.x LTS"). LTS means "the stable one" — take it, not the other button.
3. Open the downloaded file and click Next / Continue through the installer,
   accepting the defaults.

**Then close the Terminal window completely and open a new one.** Newly
installed tools are not visible to a window that was already open. This trips up
almost everyone.

Check it worked:

```bash
node -v
```

You should see a version number like `v22.16.0`. **It must be v20.9.0 or
higher.** If you see `command not found`, the installer didn't finish, or you
didn't open a fresh Terminal window.

### 1.3 Turn on pnpm

pnpm fetches the building blocks the blog is made of. It comes bundled with
Node.js but is switched off by default, so you just switch it on:

```bash
corepack enable
```

**On a Mac,** if that gives you a permission error, use this instead:

```bash
sudo corepack enable
```

It will ask for your Mac login password. Nothing appears as you type it — no
dots, no stars. That's normal. Type it and press Enter.

Now check:

```bash
pnpm -v
```

You should see `10.11.0`. The first time you run it, it may pause for a few
seconds while it downloads itself — that's expected.

> **If `corepack` isn't found**, install pnpm directly instead:
> `npm install -g pnpm@10.11.0`

### 1.4 Install Git

Git is what uploads your posts.

**On a Mac,** it may already be there. Check:

```bash
git --version
```

If you see a version number, skip ahead. If a box pops up offering to install
"command line developer tools", click **Install** and wait.

**On Windows,** download it from **<https://git-scm.com/download/win>**. Run the
installer and click Next through every screen — the defaults are correct.
Then open a **new** PowerShell window and run `git --version` to check.

### 1.5 Check all three at once

Paste this whole block in and press Enter:

```bash
node -v && pnpm -v && git --version
```

You want three version numbers, one per line, something like:

```
v22.16.0
10.11.0
git version 2.39.3
```

If all three print, the hard part is over. If any line says
`command not found`, that tool didn't install — go back and redo just that one,
remembering to open a fresh Terminal window afterwards.

---

## Part 2 — GitHub

GitHub is where your posts are stored. It's free.

### 2.1 Create the account

1. Go to **<https://github.com/signup>**
2. Use an email you actually check — you'll need to confirm it.
3. Pick a username. It becomes part of your web address on GitHub, so keep it
   simple and permanent.
4. Confirm the email they send you.

### 2.2 Let your computer log in to GitHub

Your computer needs permission to upload on your behalf. The easiest way is
GitHub's own helper tool.

**On a Mac:**

```bash
brew install gh
```

If `brew` isn't found, first install Homebrew by pasting the one-line command
from **<https://brew.sh>**, then run the line above again.

**On Windows:**

```bash
winget install --id GitHub.cli
```

Then, on either system, log in:

```bash
gh auth login
```

It asks four questions. Answer them with the arrow keys and Enter:

| Question | Answer |
| --- | --- |
| What account do you want to log into? | **GitHub.com** |
| What is your preferred protocol? | **HTTPS** |
| Authenticate Git with your GitHub credentials? | **Yes** |
| How would you like to authenticate? | **Login with a web browser** |

It shows you a short code like `A1B2-C3D4`. Copy it, press Enter, and your
browser opens. Paste the code, click **Authorize**, and go back to the Terminal.
It should say `Logged in as <your-username>`.

> Saying **Yes** to "Authenticate Git with your GitHub credentials" is the step
> that matters. It's what lets the blog's **Commit & push** button work later
> without ever asking you for a password.

### 2.3 Tell Git who you are

Git stamps your name on every post you upload. Set it once, with your own name
and the email you used for GitHub:

```bash
git config --global user.name "Purna Shrestha"
git config --global user.email "you@example.com"
```

Skipping this makes the publish button fail later with a confusing error, so do
it now.

### 2.4 Download the blog

Decide where the blog folder should live. Your Documents folder is a fine
choice:

```bash
cd ~/Documents
```

`cd` means "go to this folder". Then download the blog:

```bash
git clone https://github.com/purnasth/static-blogs.git
```

This creates a new folder called `static-blogs` containing everything. Step
into it:

```bash
cd static-blogs
```

> **If it says "Repository not found"** and the repo is private, the account you
> logged in with in step 2.2 needs to be added as a collaborator on GitHub
> first: repo → **Settings** → **Collaborators** → **Add people**.

> **If you already have this blog on your computer** from before, you don't need
> to clone it again — just use the folder you have. Note that an older copy may
> sit at `~/Documents/blogs-static` rather than `static-blogs`. Wherever it is,
> that's the path to use in every `cd` command below.

**From here on, every command in this guide assumes you are inside that
folder.** If you close the Terminal and come back tomorrow, your first command
is always:

```bash
cd ~/Documents/static-blogs
```

---

## Part 3 — Run the blog on your computer

### 3.1 Install the building blocks — once

```bash
pnpm install
```

This downloads everything the blog is made of. It takes a minute or two the
first time and prints a lot of scrolling text. That's normal. You only ever run
this again if someone changes what the blog is built from.

### 3.2 Start it

```bash
pnpm write
```

The text stops scrolling and settles on something like:

```
   ▲ Next.js 16.3.0
   - Local:  http://localhost:3000
```

**Leave this window open.** It is the blog running. Closing it, or pressing
`Ctrl + C`, switches the blog off on your machine. (That has no effect on your
live website — this is only your own copy.)

### 3.3 Open the two addresses

In your browser:

| Address | What it is |
| --- | --- |
| **<http://localhost:3000>** | Your blog, exactly as visitors will see it |
| **<http://localhost:3000/admin>** | The writing desk |

`localhost` means "this computer". Nobody else can reach these addresses — not
over the internet, not on your wifi.

> **If it says port 3000 is in use**, Next.js quietly moves to another one and
> prints it. Read the `Local:` line in the Terminal and use whatever number is
> actually there.

### 3.4 Stopping and restarting

- **To stop:** click the Terminal window and press `Ctrl + C` (that's `Ctrl`,
  not `⌘`, even on a Mac).
- **To start again tomorrow:**

  ```bash
  cd ~/Documents/static-blogs
  pnpm write
  ```

That's the whole daily ritual. Two lines.

---

## Part 4 — Write and publish a post

With `pnpm write` running, go to **<http://localhost:3000/admin>**.

### 4.1 Write it

1. Click **New post**.
2. Fill in the top box:
   - **Title** — the headline.
   - **URL** — filled in from the title automatically. Leave it alone unless you
     have a reason. *Changing it after a post is public breaks every link to it.*
   - **Date** — today, unless you're backdating.
   - **Summary** — one sentence. This is important: it's what shows up in Google
     results and in the preview when the link is shared on WhatsApp, LinkedIn or
     X. Aim for under 160 characters.
   - **Tags** — a few topics, lowercase. Type one and press Enter.
   - **Cover image** — optional, shown at the top of the post and used in the
     share preview.
3. Write the body in the big box below. It's **Markdown** — plain text with a
   few marks:

   ```markdown
   ## A heading

   Normal words. **Bold**, _italic_, and a [link](https://example.com).

   - a list item
   - another one

   > A quote.
   ```

4. **Drag a photo straight into the writing area** to add it. It's copied into
   the blog and the right text is inserted where your cursor was.

### 4.2 Save it

Press **`⌘S`** (Mac) or **`Ctrl + S`** (Windows), or click **Save**.

Your post is now a file on your computer, at
`content/posts/<your-post-name>.md`. It is not online yet.

### 4.3 Look at it properly

Click **preview ↗** to open the real page at
`http://localhost:3000/posts/<your-post-name>/`. Check it there, not just in the
editor — that's the actual page a reader will get.

### 4.4 Take it out of draft

New posts start as **drafts**. A draft is visible on your computer and is left
out of the real website entirely.

When you're ready, **untick Draft** and save again.

### 4.5 Put it online

1. Go back to **<http://localhost:3000/admin>**.
2. In the **Publish** box, write a short note describing what changed — for
   example `posts: add my trip to Pokhara`. It needs at least 8 characters.
3. Click **Commit & push**.

That uploads your post and any photos to GitHub. Cloudflare sees the change and
rebuilds the site by itself. **Your post is live in about one to two minutes** —
you don't have to do anything else, and you can close everything.

> **Nothing to publish?** The button stays off and tells you why. Usually it
> means you haven't saved, or nothing has actually changed.

### 4.6 Editing something already published

Open `/admin`, click the post, change it, save, then **Commit & push** again.
Same loop every time.

---

## Part 5 — Deploy it to the internet (once only)

**Skip this entire part if the blog is already live** — it's a one-time job. If
<https://blogs.purnashrestha.com.np> already loads, it's done.

### 5.1 Create a Cloudflare account

Sign up free at **<https://dash.cloudflare.com/sign-up>** and confirm your email.

### 5.2 Connect it to GitHub

1. In the Cloudflare dashboard, go to **Workers & Pages**.
2. Click **Create** → the **Workers** tab → **Connect to Git**.
3. Authorise Cloudflare to see your GitHub, and pick the **static-blogs** repo.

### 5.3 Enter the build settings

This is the only screen where a wrong value causes real trouble. Set exactly:

| Field | Value |
| --- | --- |
| Project name | `static-blogs` |
| Build command | `pnpm build` |
| Deploy command | `npx wrangler deploy` |

> ⚠️ **The project name must be exactly `static-blogs`.** It has to match the
> `name` in the repo's `wrangler.jsonc` file. If they differ, Cloudflare either
> errors or quietly creates a second, empty website.

Click **Save and Deploy**. The first build takes two or three minutes. When it
finishes you get a working address ending in `.workers.dev`.

### 5.4 Point your own domain at it

1. Open the Worker → **Settings** → **Domains & Routes** → **Add**.
2. Enter `blogs.purnashrestha.com.np`.

If the domain is already managed by Cloudflare, everything else is automatic.

### 5.5 Make sure the site knows its own address

Open `src/lib/site.ts` in any text editor and check the `url` line reads:

```ts
url: "https://blogs.purnashrestha.com.np",
```

This has to be right. It's what builds the link previews on social media, the
sitemap Google reads, and the RSS feed. If you change it, publish again so the
site rebuilds.

### 5.6 Tell Google the site exists

Optional, but it's how you stop waiting months to be found.

1. Go to **<https://search.google.com/search-console>** and add
   `blogs.purnashrestha.com.np` as a property.
2. Verify you own it (Cloudflare DNS verification is the easiest route).
3. Under **Sitemaps**, submit: `sitemap.xml`

From then on, every post you publish is picked up automatically.

---

## Part 6 — Your everyday routine

Once set up, this is all of it:

```bash
cd ~/Documents/static-blogs     # 1. go to the folder
pnpm write                      # 2. start it
```

3. Write at **<http://localhost:3000/admin>**, save with `⌘S`
4. Untick **Draft**, save again
5. **Commit & push**

Then `Ctrl + C` in the Terminal when you're done for the day.

**Once a month or so**, pick up any changes made elsewhere before you start
writing:

```bash
git pull
pnpm install
```

---

## Part 7 — When something goes wrong

Nothing here can lose your writing. Saved posts are files on your computer; even
a failed publish leaves them safe.

| What you see | What it means | What to do |
| --- | --- | --- |
| `command not found: node` (or pnpm, git) | The tool isn't installed, or the Terminal window predates the install | Close the Terminal, open a new one, try again. Still failing? Reinstall that tool. |
| `no such file or directory` | You're not in the blog folder | `cd ~/Documents/static-blogs` |
| `Port 3000 is in use` | An old copy is still running | Read the `Local:` line — it moved to another port and told you. Or run `pkill -f "next dev"` and start again. |
| The `/admin` page is a 404 | The server isn't running, or it's a stale tab | Check the Terminal still shows the server. Restart with `pnpm write`. |
| **Commit & push** says "no remote configured" | The folder isn't linked to GitHub | You likely copied the folder instead of using `git clone` (step 2.4). Your posts are safe — clone properly and move your `content/posts` files across. |
| **Commit & push** fails on the push | GitHub login expired | Run `gh auth login` again (step 2.2). |
| **Commit & push** fails mentioning `user.email` | Git doesn't know who you are | Do step 2.3. |
| The post isn't on the live site | It's still a draft | Untick **Draft**, save, publish again. |
| Still not there after 5 minutes | The build failed | Cloudflare dashboard → your Worker → **Deployments**. The failed one shows the reason in red. |
| Sharing the link shows no picture | The share image is cached by the platform | Paste the URL into <https://www.opengraph.xyz> to see what crawlers actually get. Facebook and LinkedIn each have a "scrape again" tool that clears their cache. |
| A broken image in a post | The photo isn't where the text says it is | The path must start `/images/`, and the file must be in `public/images/`. Re-drag the photo in. |

**Still stuck?** Copy the red text from the Terminal — the exact wording is
almost always the answer, and it's the first thing anyone helping you will ask
for.

---

## What's where, if you're curious

```
content/posts/         your posts, one .md file each
content/about.md       the About page
public/images/         photos you've added
src/lib/site.ts        site title, description, domain
```

You can edit any of these in a plain text editor instead of using the writing
desk. The editor and the files are two doors into the same room.

For everything else — how it's built, how to change the design, the full
troubleshooting list — see [DEVELOPING.md](./DEVELOPING.md).
