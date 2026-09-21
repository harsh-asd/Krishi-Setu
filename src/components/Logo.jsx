
import { useLanguage } from "../translations/LanguageContext";
import logo from "../assets/krishisetu-logo-new.jpg";

function Logo({
  size = 40,
  showName = false,
}) {

  const { t } =
    useLanguage();

  return (
    <div
      className={
        showName
          ? "krishisetu-logo krishisetu-logo-with-name"
          : "krishisetu-logo krishisetu-logo-mark-only"
      }
    >

      <img style={{ borderRadius: '50%', objectFit: 'cover' }}
        className="krishisetu-logo-mark"
        src={logo}
        width={size}
        height={size}
        alt="KrishiSetu"
      />


      {showName && (

        <div className="krishisetu-logo-wordmark">

          <strong>
            KrishiSetu
          </strong>

          <span>
            {t("common.smartProcurement")}
          </span>

        </div>

      )}

    </div>
  );
}

export default Logo;
