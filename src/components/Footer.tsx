import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "@tanstack/react-router";

export function Footer(): ReactElement {
  const { t } = useTranslation();

  const products = [
    { label: "footer.sections.products.cantoLyr", route: "/canto-lyr" },
    { label: "footer.sections.products.cantoCap", route: "/canto-cap" },
  ] as const;

  return (
    <>
      <footer className="mt-24 border-t-8 border-primary bg-primary/10 text-primary">
        <div className="mx-auto max-w-6xl px-6 py-12 md:px-10">
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
            {t("footer.title")}
          </h2>
          <p className="mt-3 max-w-3xl text-base sm:text-lg text-primary/80">
            {t("footer.summary")}
          </p>
          <div className="mt-8 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            <section>
              <h3 className="text-lg font-semibold">
                {t("footer.sections.gettingStarted.title")}
              </h3>
              <ul className="mt-3 space-y-2 text-primary/80">
                <li>{t("footer.sections.gettingStarted.about")}</li>
                <li>{t("footer.sections.gettingStarted.background")}</li>
              </ul>
            </section>
            <section>
              <h3 className="text-lg font-semibold">
                {t("footer.sections.resources.title")}
              </h3>
              <ul className="mt-3 space-y-2 text-primary/80">
                <li>{t("footer.sections.resources.downloads")}</li>
                <li>{t("footer.sections.resources.integrations")}</li>
                <li>{t("footer.sections.resources.media")}</li>
              </ul>
            </section>
            <section>
              <h3 className="text-lg font-semibold">
                {t("footer.sections.community.title")}
              </h3>
              <ul className="mt-3 space-y-2 text-primary/80">
                <li>{t("footer.sections.community.qa")}</li>
                <li>{t("footer.sections.community.tutors")}</li>
              </ul>
            </section>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <div>
              <h3 className="text-lg font-semibold">
                {t("footer.sections.products.title")}
              </h3>
              <ul className="mt-3 space-y-2 text-primary/90">
                {products.map(({ label, route }) => (
                  <li key={route}>
                    <Link to={route} className="font-semibold hover:underline">
                      {t(label)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div className="text-sm text-primary/70">
              <p>{t("footer.disclaimer")}</p>
            </div>
          </div>
        </div>
      </footer>
      <div className="bg-primary text-primary-foreground">
        <div className="mx-auto max-w-6xl px-6 py-8 md:px-10">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <ul className="flex gap-4">
              <li>
                <a href="#" className="hover:underline">
                  {t("footer.sections.legal.terms")}
                </a>
              </li>
              <li>
                <a href="#" className="hover:underline">
                  {t("footer.sections.legal.privacy")}
                </a>
              </li>
              <li>
                <a href="#" className="hover:underline">
                  {t("footer.sections.legal.accessibility")}
                </a>
              </li>
            </ul>
            <div className="text-sm">
              <p>{t("footer.copyright")}</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
