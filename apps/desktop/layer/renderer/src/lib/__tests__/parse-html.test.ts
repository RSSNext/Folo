import { describe, expect, it } from "vitest"

import { extractCodeFromHtml } from "../parse-html"

describe("extractCodeFromHtml", () => {
  it("should extract code from div elements", () => {
    const htmlString = "<div>line 1</div><div>line 2</div>"
    const result = extractCodeFromHtml(htmlString)

    expect(result).toBe("line 1\nline 2\n")
  })

  it("should extract code from span elements with line breaks", () => {
    const htmlString = "<span><span>line 1</span></span><span><span>line 2</span></span>"
    const result = extractCodeFromHtml(htmlString)

    expect(result).toMatchInlineSnapshot(`
      "line 1line 2
      "
    `)
  })

  it("should extract code from span elements without line breaks", () => {
    const htmlString = "<span><span>line 1</span></span><span><span>line 2</span></span>"
    const result = extractCodeFromHtml(htmlString)

    expect(result).toMatchInlineSnapshot(`
      "line 1line 2
      "
    `)
  })

  it("should return the entire text content if no specific structure is found", () => {
    const htmlString = "plain text content"
    const result = extractCodeFromHtml(htmlString)

    expect(result).toBe("plain text content")
  })

  it("pre > code", () => {
    const htmlString = `<pre class="language-ts lang-ts"><code class="language-ts lang-ts">import i18next from &#x27;i18next&#x27; import { initReactI18next } from &#x27;react-i18next&#x27; import en from &#x27;@/locales/en.json&#x27; import zhCN from &#x27;@/locales/zh_CN.json&#x27; i18next.use(initReactI18next).init({ lng: &#x27;zh&#x27;, fallbackLng: &#x27;en&#x27;, resources: { en: { translation: en, }, zh: { translation: zhCN, }, }, })</code></pre>`
    const result = extractCodeFromHtml(htmlString)

    expect(result).toMatchInlineSnapshot(
      `"import i18next from 'i18next' import { initReactI18next } from 'react-i18next' import en from '@/locales/en.json' import zhCN from '@/locales/zh_CN.json' i18next.use(initReactI18next).init({ lng: 'zh', fallbackLng: 'en', resources: { en: { translation: en, }, zh: { translation: zhCN, }, }, })"`,
    )
  })

  it("pre > code 2", () => {
    const htmlString = `<pre><code class="language-ts">import type { Namespace } from '@/types'; export const namespace: Namespace = { // ... }; </code></pre>`
    const result = extractCodeFromHtml(htmlString)

    expect(result).toMatchInlineSnapshot(
      `"import type { Namespace } from '@/types'; export const namespace: Namespace = { // ... }; "`,
    )
  })

  it("pre", () => {
    const htmlString = `<pre>@keyframes seed {
    0%{--seed:0}1%{--seed:1}2%{--seed:2}3%{--seed:3}4%{--seed:4}5%{--seed:5}6%{--seed:6}7%{--seed:7}8%{--seed:8}9%{--seed:9}10%{--seed:10}11%{--seed:11}...95%{--seed:95}96%{--seed:96}97%{--seed:97}98%{--seed:98}99%{--seed:99}100%{--seed:100}
}</pre>`
    const result = extractCodeFromHtml(htmlString)

    expect(result).toMatchInlineSnapshot(`"@keyframes seed {
    0%{--seed:0}1%{--seed:1}2%{--seed:2}3%{--seed:3}4%{--seed:4}5%{--seed:5}6%{--seed:6}7%{--seed:7}8%{--seed:8}9%{--seed:9}10%{--seed:10}11%{--seed:11}...95%{--seed:95}96%{--seed:96}97%{--seed:97}98%{--seed:98}99%{--seed:99}100%{--seed:100}
}"`)
  })

  it("pre 2", () => {
    const htmlString = `<pre>@property --seed {
  syntax: "&lt;integer&gt;";
  inherits: true;
  initial-value: 0;
}

@keyframes seed {
  from { --seed: 0; }
  to { --seed: 100; }
}</pre>`
    const result = extractCodeFromHtml(htmlString)

    expect(result).toMatchInlineSnapshot(`
      "@property --seed {
        syntax: "<integer>";
        inherits: true;
        initial-value: 0;
      }

      @keyframes seed {
        from { --seed: 0; }
        to { --seed: 100; }
      }"
    `)
  })

  it("pre > lang-*", () => {
    const htmlString = `<pre><code class="lang-javascript">module.exports = {
  output: &quot;standalone&quot;,
}</code></pre>`
    const result = extractCodeFromHtml(htmlString)

    expect(result).toMatchInlineSnapshot(`
      "module.exports = {
        output: "standalone",
      }"
    `)
  })

  it("shiki render", () => {
    const htmlString = `<pre class="shiki shiki-themes github-light github-dark" style="background-color:#fff;--shiki-dark-bg:#24292e;color:#24292e;--shiki-dark:#e1e4e8" tabindex="0"><code><span class="line" style="width: 920px;"><span style="color:#D73A49;--shiki-dark:#F97583">import</span><span style="color:#24292E;--shiki-dark:#E1E4E8"> i18next </span><span style="color:#D73A49;--shiki-dark:#F97583">from</span><span style="color:#032F62;--shiki-dark:#9ECBFF"> 'i18next'</span></span>
<span class="line" style="width: 920px;"><span style="color:#D73A49;--shiki-dark:#F97583">import</span><span style="color:#24292E;--shiki-dark:#E1E4E8"> { initReactI18next } </span><span style="color:#D73A49;--shiki-dark:#F97583">from</span><span style="color:#032F62;--shiki-dark:#9ECBFF"> 'react-i18next'</span></span>
<span class="line" style="width: 920px;"></span>
<span class="line" style="width: 920px;"><span style="color:#D73A49;--shiki-dark:#F97583">import</span><span style="color:#24292E;--shiki-dark:#E1E4E8"> en </span><span style="color:#D73A49;--shiki-dark:#F97583">from</span><span style="color:#032F62;--shiki-dark:#9ECBFF"> '@/locales/en.json'</span></span>
<span class="line" style="width: 920px;"><span style="color:#D73A49;--shiki-dark:#F97583">import</span><span style="color:#24292E;--shiki-dark:#E1E4E8"> zhCN </span><span style="color:#D73A49;--shiki-dark:#F97583">from</span><span style="color:#032F62;--shiki-dark:#9ECBFF"> '@/locales/zh_CN.json'</span></span>
<span class="line" style="width: 920px;"></span>
<span class="line" style="width: 920px;"><span style="color:#24292E;--shiki-dark:#E1E4E8">i18next.</span><span style="color:#6F42C1;--shiki-dark:#B392F0">use</span><span style="color:#24292E;--shiki-dark:#E1E4E8">(initReactI18next).</span><span style="color:#6F42C1;--shiki-dark:#B392F0">init</span><span style="color:#24292E;--shiki-dark:#E1E4E8">({</span></span>
<span class="line" style="width: 920px;"><span style="color:#24292E;--shiki-dark:#E1E4E8">  lng: </span><span style="color:#032F62;--shiki-dark:#9ECBFF">'zh'</span><span style="color:#24292E;--shiki-dark:#E1E4E8">,</span></span>
<span class="line" style="width: 920px;"><span style="color:#24292E;--shiki-dark:#E1E4E8">  fallbackLng: </span><span style="color:#032F62;--shiki-dark:#9ECBFF">'en'</span><span style="color:#24292E;--shiki-dark:#E1E4E8">,</span></span>
<span class="line" style="width: 920px;"><span style="color:#24292E;--shiki-dark:#E1E4E8">  resources: {</span></span>
<span class="line" style="width: 920px;"><span style="color:#24292E;--shiki-dark:#E1E4E8">    en: {</span></span>
<span class="line" style="width: 920px;"><span style="color:#24292E;--shiki-dark:#E1E4E8">      translation: en,</span></span>
<span class="line" style="width: 920px;"><span style="color:#24292E;--shiki-dark:#E1E4E8">    },</span></span>
<span class="line" style="width: 920px;"><span style="color:#24292E;--shiki-dark:#E1E4E8">    zh: {</span></span>
<span class="line" style="width: 920px;"><span style="color:#24292E;--shiki-dark:#E1E4E8">      translation: zhCN,</span></span>
<span class="line" style="width: 920px;"><span style="color:#24292E;--shiki-dark:#E1E4E8">    },</span></span>
<span class="line" style="width: 920px;"><span style="color:#24292E;--shiki-dark:#E1E4E8">  },</span></span>
<span class="line" style="width: 920px;"><span style="color:#24292E;--shiki-dark:#E1E4E8">})</span></span></code></pre>`
    const result = extractCodeFromHtml(htmlString)

    expect(result).toMatchInlineSnapshot(`
      "import i18next from 'i18next'
      import { initReactI18next } from 'react-i18next'

      import en from '@/locales/en.json'
      import zhCN from '@/locales/zh_CN.json'

      i18next.use(initReactI18next).init({
        lng: 'zh',
        fallbackLng: 'en',
        resources: {
          en: {
            translation: en,
          },
          zh: {
            translation: zhCN,
          },
        },
      })
      "
    `)
  })

  it("pre > code, without line wrapper", () => {
    const htmlString = `<pre class=" language-dockerfile"><code class=" language-dockerfile"><span class="token keyword">FROM</span> node<span class="token punctuation">:</span>20.15<span class="token punctuation">-</span>alpine AS runner

<span class="token keyword">ENV</span> NODE_ENV production

<span class="token comment"># Create app directory</span>
<span class="token keyword">WORKDIR</span> /app

<span class="token keyword">RUN</span> addgroup <span class="token punctuation">-</span><span class="token punctuation">-</span>system <span class="token punctuation">-</span><span class="token punctuation">-</span>gid 1001 nodejs
<span class="token keyword">RUN</span> adduser <span class="token punctuation">-</span><span class="token punctuation">-</span>system <span class="token punctuation">-</span><span class="token punctuation">-</span>uid 1001 nextjs

<span class="token keyword">COPY</span> public /app/public

<span class="token comment"># Set the correct permission for prerender cache</span>
<span class="token keyword">RUN</span> mkdir .next
<span class="token keyword">RUN</span> chown nextjs<span class="token punctuation">:</span>nodejs .next

<span class="token comment"># Automatically leverage output traces to reduce image size</span>
<span class="token comment"># https://nextjs.org/docs/advanced-features/output-file-tracing</span>
<span class="token keyword">COPY</span> <span class="token punctuation">-</span><span class="token punctuation">-</span>chown=nextjs<span class="token punctuation">:</span>nodejs .next/standalone ./
<span class="token keyword">COPY</span> <span class="token punctuation">-</span><span class="token punctuation">-</span>chown=nextjs<span class="token punctuation">:</span>nodejs .next/static .next/static

<span class="token keyword">USER</span> nextjs

<span class="token keyword">EXPOSE</span> 3000
<span class="token keyword">ENV</span> PORT 3000

<span class="token keyword">CMD</span> <span class="token punctuation">[</span><span class="token string">"ls"</span><span class="token punctuation">,</span> <span class="token string">"-l"</span><span class="token punctuation">]</span>

<span class="token comment"># server.js is created by next build from the standalone output</span>
<span class="token comment"># https://nextjs.org/docs/pages/api-reference/next-config-js/output</span>
<span class="token keyword">CMD</span> HOSTNAME=<span class="token string">"0.0.0.0"</span> node server.js</code></pre>`
    const result = extractCodeFromHtml(htmlString)

    expect(result).toMatchInlineSnapshot(`
      "FROM node:20.15-alpine AS runner

      ENV NODE_ENV production

      # Create app directory
      WORKDIR /app

      RUN addgroup --system --gid 1001 nodejs
      RUN adduser --system --uid 1001 nextjs

      COPY public /app/public

      # Set the correct permission for prerender cache
      RUN mkdir .next
      RUN chown nextjs:nodejs .next

      # Automatically leverage output traces to reduce image size
      # https://nextjs.org/docs/advanced-features/output-file-tracing
      COPY --chown=nextjs:nodejs .next/standalone ./
      COPY --chown=nextjs:nodejs .next/static .next/static

      USER nextjs

      EXPOSE 3000
      ENV PORT 3000

      CMD ["ls", "-l"]

      # server.js is created by next build from the standalone output
      # https://nextjs.org/docs/pages/api-reference/next-config-js/output
      CMD HOSTNAME="0.0.0.0" node server.js"
    `)
  })

  it("hijs", () => {
    const htmlString = `<pre tabindex="0" class="hljs language-css"><a href="javascript:" class="copy" tabindex="0" title="复制"><svg class="icon-copy"><use xlink:href="#icon-copy"></use></svg></a><a href="javascript:" class="beatuy revert" tabindex="0" title="还原"><svg class="icon-palette"><use xlink:href="#icon-palette"></use></svg></a><span class="hljs-keyword">@keyframes</span> seed {
    <span class="hljs-number">0%</span>{<span class="hljs-attr">--seed</span>:<span class="hljs-number">0</span>}<span class="hljs-number">1%</span>{<span class="hljs-attr">--seed</span>:<span class="hljs-number">1</span>}<span class="hljs-number">2%</span>{<span class="hljs-attr">--seed</span>:<span class="hljs-number">2</span>}<span class="hljs-number">3%</span>{<span class="hljs-attr">--seed</span>:<span class="hljs-number">3</span>}<span class="hljs-number">4%</span>{<span class="hljs-attr">--seed</span>:<span class="hljs-number">4</span>}<span class="hljs-number">5%</span>{<span class="hljs-attr">--seed</span>:<span class="hljs-number">5</span>}<span class="hljs-number">6%</span>{<span class="hljs-attr">--seed</span>:<span class="hljs-number">6</span>}<span class="hljs-number">7%</span>{<span class="hljs-attr">--seed</span>:<span class="hljs-number">7</span>}<span class="hljs-number">8%</span>{<span class="hljs-attr">--seed</span>:<span class="hljs-number">8</span>}<span class="hljs-number">9%</span>{<span class="hljs-attr">--seed</span>:<span class="hljs-number">9</span>}<span class="hljs-number">10%</span>{<span class="hljs-attr">--seed</span>:<span class="hljs-number">10</span>}<span class="hljs-number">11%</span>{<span class="hljs-attr">--seed</span>:<span class="hljs-number">11</span>}...<span class="hljs-number">95%</span>{<span class="hljs-attr">--seed</span>:<span class="hljs-number">95</span>}<span class="hljs-number">96%</span>{<span class="hljs-attr">--seed</span>:<span class="hljs-number">96</span>}<span class="hljs-number">97%</span>{<span class="hljs-attr">--seed</span>:<span class="hljs-number">97</span>}<span class="hljs-number">98%</span>{<span class="hljs-attr">--seed</span>:<span class="hljs-number">98</span>}<span class="hljs-number">99%</span>{<span class="hljs-attr">--seed</span>:<span class="hljs-number">99</span>}<span class="hljs-number">100%</span>{<span class="hljs-attr">--seed</span>:<span class="hljs-number">100</span>}
}</pre>`
    const result = extractCodeFromHtml(htmlString)

    expect(result).toMatchInlineSnapshot(`
      "@keyframes seed {
          0%{--seed:0}1%{--seed:1}2%{--seed:2}3%{--seed:3}4%{--seed:4}5%{--seed:5}6%{--seed:6}7%{--seed:7}8%{--seed:8}9%{--seed:9}10%{--seed:10}11%{--seed:11}...95%{--seed:95}96%{--seed:96}97%{--seed:97}98%{--seed:98}99%{--seed:99}100%{--seed:100}
      }"
    `)
  })

  it("hijs 2", () => {
    const htmlString = `<pre translate="no" class="flat-scrollbar-normal not-prose rounded-md bg-[#F6F8FA] p-2 text-sm selection:bg-gray-300 selection:text-inherit dark:bg-[#0d1117] dark:selection:bg-gray-700"><code class="hljs language-typescript"><span class="hljs-keyword">function</span> <span class="hljs-title function_">randInterval</span>(<span class="hljs-params"></span>): <span class="hljs-built_in">number</span> {
  <span class="hljs-keyword">return</span> <span class="hljs-title class_">Math</span>.<span class="hljs-title function_">random</span>();
}

<span class="hljs-keyword">function</span> <span class="hljs-title function_">boxMuller</span>(<span class="hljs-params">mu: <span class="hljs-built_in">number</span>, sigma: <span class="hljs-built_in">number</span></span>): [<span class="hljs-built_in">number</span>, <span class="hljs-built_in">number</span>] {
  <span class="hljs-keyword">const</span> u = <span class="hljs-title function_">randInterval</span>();
  <span class="hljs-keyword">const</span> v = <span class="hljs-title function_">randInterval</span>();
  <span class="hljs-keyword">const</span> x = <span class="hljs-title class_">Math</span>.<span class="hljs-title function_">cos</span>(<span class="hljs-number">2</span> * <span class="hljs-title class_">Math</span>.<span class="hljs-property">PI</span> * u) * <span class="hljs-title class_">Math</span>.<span class="hljs-title function_">sqrt</span>(-<span class="hljs-number">2</span> * <span class="hljs-title class_">Math</span>.<span class="hljs-title function_">log</span>(v));
  <span class="hljs-keyword">const</span> y = <span class="hljs-title class_">Math</span>.<span class="hljs-title function_">sin</span>(<span class="hljs-number">2</span> * <span class="hljs-title class_">Math</span>.<span class="hljs-property">PI</span> * u) * <span class="hljs-title class_">Math</span>.<span class="hljs-title function_">sqrt</span>(-<span class="hljs-number">2</span> * <span class="hljs-title class_">Math</span>.<span class="hljs-title function_">log</span>(v));
  <span class="hljs-keyword">return</span> [x * sigma + mu, y * sigma + mu];
}

<span class="hljs-comment">// Usage example</span>
<span class="hljs-keyword">const</span> [value1, value2] = <span class="hljs-title function_">boxMuller</span>(<span class="hljs-number">0</span>, <span class="hljs-number">1</span>);
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(value1, value2);
<span class="hljs-comment">// Outputs two normally distributed random numbers</span>
</code></pre>`
    const result = extractCodeFromHtml(htmlString)

    expect(result).toMatchInlineSnapshot(`
      "function randInterval(): number {
        return Math.random();
      }

      function boxMuller(mu: number, sigma: number): [number, number] {
        const u = randInterval();
        const v = randInterval();
        const x = Math.cos(2 * Math.PI * u) * Math.sqrt(-2 * Math.log(v));
        const y = Math.sin(2 * Math.PI * u) * Math.sqrt(-2 * Math.log(v));
        return [x * sigma + mu, y * sigma + mu];
      }

      // Usage example
      const [value1, value2] = boxMuller(0, 1);
      console.log(value1, value2);
      // Outputs two normally distributed random numbers

      "
    `)
  })

  it("hijs without wrapper", () => {
    const htmlString = `<pre><span>import</span> * <span>as</span> fs <span>from</span> <span>&quot;fs&quot;</span>;
<span>import</span> * <span>as</span> plotly <span>from</span> <span>&quot;plotly.js-dist&quot;</span>;

<span>// Generate random numbers following a normal distribution using Box-Muller</span>
<span>function</span> <span>randInterval</span>(<span></span>): <span>number</span> {
  <span>return</span> <span>Math</span>.<span>random</span>();
}

<span>function</span> <span>boxMuller</span>(<span>mu: <span>number</span>, sigma: <span>number</span></span>): [<span>number</span>, <span>number</span>] {
  <span>const</span> u = <span>randInterval</span>();
  <span>const</span> v = <span>randInterval</span>();
  <span>const</span> x = <span>Math</span>.<span>cos</span>(<span>2</span> * <span>Math</span>.<span>PI</span> * u) * <span>Math</span>.<span>sqrt</span>(-<span>2</span> * <span>Math</span>.<span>log</span>(v));
  <span>const</span> y = <span>Math</span>.<span>sin</span>(<span>2</span> * <span>Math</span>.<span>PI</span> * u) * <span>Math</span>.<span>sqrt</span>(-<span>2</span> * <span>Math</span>.<span>log</span>(v));
  <span>return</span> [x * sigma + mu, y * sigma + mu];
}

<span>// Generate n normally distributed random numbers</span>
<span>function</span> <span>generateNormalDistribution</span>(<span>
  mu: <span>number</span>,
  sigma: <span>number</span>,
  n: <span>number</span>
</span>): <span>number</span>[] {
  <span>const</span> <span>values</span>: <span>number</span>[] = [];
  <span>for</span> (<span>let</span> i = <span>0</span>; i &lt; n / <span>2</span>; i++) {
    <span>const</span> [value1, value2] = <span>boxMuller</span>(mu, sigma);
    values.<span>push</span>(value1, value2);
  }
  <span>return</span> values;
}

<span>// Generate the data</span>
<span>const</span> mu = <span>0</span>;
<span>const</span> sigma = <span>1</span>;
<span>const</span> sampleSize = <span>10000</span>; <span>// Sample size</span>
<span>const</span> values = <span>generateNormalDistribution</span>(mu, sigma, sampleSize);

<span>// Calculate the mean and variance of the generated random numbers</span>
<span>const</span> mean = values.<span>reduce</span>(<span>(<span>acc, val</span>) =&gt;</span> acc + val, <span>0</span>) / values.<span>length</span>;
<span>const</span> variance =
  values.<span>reduce</span>(<span>(<span>acc, val</span>) =&gt;</span> acc + (val - mean) ** <span>2</span>, <span>0</span>) / values.<span>length</span>;
  </pre>
`
    const result = extractCodeFromHtml(htmlString)

    expect(result).toMatchInlineSnapshot(`
      "import * as fs from "fs";
      import * as plotly from "plotly.js-dist";

      // Generate random numbers following a normal distribution using Box-Muller
      function randInterval(): number {
        return Math.random();
      }

      function boxMuller(mu: number, sigma: number): [number, number] {
        const u = randInterval();
        const v = randInterval();
        const x = Math.cos(2 * Math.PI * u) * Math.sqrt(-2 * Math.log(v));
        const y = Math.sin(2 * Math.PI * u) * Math.sqrt(-2 * Math.log(v));
        return [x * sigma + mu, y * sigma + mu];
      }

      // Generate n normally distributed random numbers
      function generateNormalDistribution(
        mu: number,
        sigma: number,
        n: number
      ): number[] {
        const values: number[] = [];
        for (let i = 0; i < n / 2; i++) {
          const [value1, value2] = boxMuller(mu, sigma);
          values.push(value1, value2);
        }
        return values;
      }

      // Generate the data
      const mu = 0;
      const sigma = 1;
      const sampleSize = 10000; // Sample size
      const values = generateNormalDistribution(mu, sigma, sampleSize);

      // Calculate the mean and variance of the generated random numbers
      const mean = values.reduce((acc, val) => acc + val, 0) / values.length;
      const variance =
        values.reduce((acc, val) => acc + (val - mean) ** 2, 0) / values.length;
        
      "
    `)
  })

  it("no <code />", () => {
    const htmlString = `<span class="line"><span class="keyword">if</span> theme.<span class="property">twikoo</span>.<span class="property">enable</span> == <span class="literal">true</span></span><br><span class="line">  #tcomment</span><br><span class="line">  <span class="title function_">script</span>(src=<span class="string">'https://registry.npmmirror.com/twikoo/1.6.39/files/dist/twikoo.all.min.js'</span>)</span><br><span class="line">  script.</span><br><span class="line">    twikoo.<span class="title function_">init</span>({</span><br><span class="line">      <span class="attr">envId</span>: <span class="string">'#{theme.twikoo.envId}'</span>,</span><br><span class="line">      <span class="attr">el</span>: <span class="string">'#tcomment'</span>,</span><br><span class="line">      <span class="attr">region</span>: <span class="string">'#{theme.twikoo.region}'</span>,</span><br><span class="line">      <span class="attr">path</span>: <span class="string">'#{theme.twikoo.path}'</span>,</span><br><span class="line">      <span class="attr">onCommentLoaded</span>: <span class="keyword">function</span> (<span class="params"></span>) {</span><br><span class="line">        <span class="keyword">const</span> commentCountElement = <span class="variable language_">document</span>.<span class="title function_">querySelector</span>(<span class="string">'.tk-comments-count'</span>);</span><br><span class="line">        <span class="keyword">const</span> targetElement = <span class="variable language_">document</span>.<span class="title function_">querySelector</span>(<span class="string">'.waline-comment-count'</span>);</span><br><span class="line">        <span class="keyword">if</span> (commentCountElement) {</span><br><span class="line">          <span class="keyword">const</span> countSpan = commentCountElement.<span class="title function_">querySelector</span>(<span class="string">'span:first-child'</span>);</span><br><span class="line">          <span class="keyword">const</span> commentCount = <span class="built_in">parseInt</span>(countSpan.<span class="property">textContent</span>);</span><br><span class="line">          targetElement.<span class="property">textContent</span> = commentCount;</span><br><span class="line">        } <span class="keyword">else</span> {</span><br><span class="line">          <span class="variable language_">console</span>.<span class="title function_">log</span>(<span class="string">'未找到评论数量元素'</span>);</span><br><span class="line">        }</span><br><span class="line">      }</span><br><span class="line">    })</span><br><span class="line"></span><br>`
    const result = extractCodeFromHtml(htmlString)

    expect(result).toMatchInlineSnapshot(
      `"if theme.twikoo.enable == true  #tcomment  script(src='https://registry.npmmirror.com/twikoo/1.6.39/files/dist/twikoo.all.min.js')  script.    twikoo.init({      envId: '#{theme.twikoo.envId}',      el: '#tcomment',      region: '#{theme.twikoo.region}',      path: '#{theme.twikoo.path}',      onCommentLoaded: function () {        const commentCountElement = document.querySelector('.tk-comments-count');        const targetElement = document.querySelector('.waline-comment-count');        if (commentCountElement) {          const countSpan = commentCountElement.querySelector('span:first-child');          const commentCount = parseInt(countSpan.textContent);          targetElement.textContent = commentCount;        } else {          console.log('未找到评论数量元素');        }      }    })"`,
    )
  })
})
