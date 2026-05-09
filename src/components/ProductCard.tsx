import { useEffect, useState } from "react";
import {
  Product,
  getProductVariants,
  getSettings,
  CardFormat,
} from "@/lib/products";
import {
  CompactCardFormat,
  ModernCardFormat,
  PremiumCardFormat,
} from "./ProductCardFormats";

const ProductCard = ({ product }: { product: Product }) => {
  const [variantCount, setVariantCount] = useState(0);
  const [cardFormat, setCardFormat] = useState<CardFormat>("compact");

  useEffect(() => {
    const loadVariants = async () => {
      const variants = await getProductVariants(product.id);
      setVariantCount(variants.length);
    };
    loadVariants();
  }, [product.id]);

  useEffect(() => {
    const settings = getSettings();
    setCardFormat(settings.cardFormat);

    const handleSettingsUpdate = () => {
      const updatedSettings = getSettings();
      setCardFormat(updatedSettings.cardFormat);
    };

    window.addEventListener("settings-updated", handleSettingsUpdate);
    return () => window.removeEventListener("settings-updated", handleSettingsUpdate);
  }, []);

  const formatProps = { product, variantCount };

  switch (cardFormat) {
    case "compact":
      return <CompactCardFormat {...formatProps} />;
    case "premium":
      return <PremiumCardFormat {...formatProps} />;
    case "modern":
    default:
      return <ModernCardFormat {...formatProps} />;
  }
};

export default ProductCard;
