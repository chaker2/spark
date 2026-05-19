import { SparkLogo } from "./SparkLogo";
import { useTranslation } from "react-i18next";

export function Footer() {
  const { t } = useTranslation();
  return (
    <footer className="px-4 pb-10">
      <div className="mx-auto max-w-7xl rounded-3xl bg-card border border-border shadow-soft p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <SparkLogo />
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} SPARK · {t("footer.tag")}
        </p>
      </div>
    </footer>
  );
}
