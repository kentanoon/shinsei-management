/**
 * バリデーションユーティリティ
 * フォーム入力値の検証とエラーメッセージ生成
 */

// バリデーション結果の型定義
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface FieldValidationResult {
  isValid: boolean;
  error?: string;
}

// プロジェクト関連のバリデーション
export class ProjectValidator {
  
  static validateProjectName(name: string): FieldValidationResult {
    if (!name || !name.trim()) {
      return { isValid: false, error: 'プロジェクト名は必須です' };
    }
    
    if (name.trim().length > 200) {
      return { isValid: false, error: 'プロジェクト名は200文字以内で入力してください' };
    }
    
    // 特殊文字チェック
    const forbiddenChars = ['<', '>', '"', "'", '&'];
    if (forbiddenChars.some(char => name.includes(char))) {
      return { isValid: false, error: 'プロジェクト名に使用できない文字が含まれています' };
    }
    
    return { isValid: true };
  }
  
  static validateStatus(status: string): FieldValidationResult {
    const validStatuses = [
      "事前相談", "受注", "申請作業", "審査中", 
      "配筋検査待ち", "中間検査待ち", "完了検査待ち", "完了", "失注"
    ];
    
    if (!validStatuses.includes(status)) {
      return { 
        isValid: false, 
        error: `ステータスは ${validStatuses.join(", ")} のいずれかである必要があります` 
      };
    }
    
    return { isValid: true };
  }
  
  static validateInputDate(date: string): FieldValidationResult {
    if (!date) {
      return { isValid: true }; // 任意項目
    }
    
    const inputDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (inputDate > today) {
      return { isValid: false, error: '入力日は今日以前の日付を指定してください' };
    }
    
    return { isValid: true };
  }
}

// 顧客情報のバリデーション
export class CustomerValidator {
  
  static validateOwnerName(name: string): FieldValidationResult {
    if (!name || !name.trim()) {
      return { isValid: false, error: '施主名は必須です' };
    }
    
    if (name.trim().length > 100) {
      return { isValid: false, error: '施主名は100文字以内で入力してください' };
    }
    
    return { isValid: true };
  }
  
  static validateKana(kana: string | undefined, fieldName: string): FieldValidationResult {
    if (!kana) {
      return { isValid: true }; // 任意項目
    }
    
    if (kana.length > 100) {
      return { isValid: false, error: `${fieldName}は100文字以内で入力してください` };
    }
    
    // ひらがな・カタカナ・スペースのみ許可
    const kanaPattern = /^[あ-んア-ンヴー\s　]*$/;
    if (!kanaPattern.test(kana)) {
      return { isValid: false, error: `${fieldName}はひらがな・カタカナで入力してください` };
    }
    
    return { isValid: true };
  }
  
  static validatePostalCode(postalCode: string | undefined): FieldValidationResult {
    if (!postalCode) {
      return { isValid: true }; // 任意項目
    }
    
    // ハイフンを除去して数字のみチェック
    const digitsOnly = postalCode.replace('-', '');
    if (!digitsOnly.match(/^\d{7}$/)) {
      return { isValid: false, error: '郵便番号は7桁の数字で入力してください（例：123-4567）' };
    }
    
    return { isValid: true };
  }
  
  static validatePhoneNumber(phone: string | undefined): FieldValidationResult {
    if (!phone) {
      return { isValid: true }; // 任意項目
    }
    
    // 数字、ハイフン、括弧、スペースのみ許可
    const allowedChars = phone.replace(/[-()(\s　]/g, '');
    if (!allowedChars.match(/^\d+$/)) {
      return { isValid: false, error: '電話番号は数字、ハイフン、括弧のみ使用可能です' };
    }
    
    if (allowedChars.length < 10 || allowedChars.length > 11) {
      return { isValid: false, error: '電話番号は10桁または11桁で入力してください' };
    }
    
    return { isValid: true };
  }
}

// 敷地情報のバリデーション
export class SiteValidator {
  
  static validateAddress(address: string): FieldValidationResult {
    if (!address || !address.trim()) {
      return { isValid: false, error: '建設地住所は必須です' };
    }
    
    if (address.trim().length > 500) {
      return { isValid: false, error: '建設地住所は500文字以内で入力してください' };
    }
    
    return { isValid: true };
  }
  
  static validateLandArea(area: number | undefined): FieldValidationResult {
    if (area === undefined || area === null) {
      return { isValid: true }; // 任意項目
    }
    
    if (area <= 0) {
      return { isValid: false, error: '敷地面積は0より大きい値を入力してください' };
    }
    
    if (area > 999999.99) {
      return { isValid: false, error: '敷地面積は999999.99㎡以下で入力してください' };
    }
    
    return { isValid: true };
  }
}

// 建物情報のバリデーション
export class BuildingValidator {
  
  static validateMaxHeight(height: number | undefined): FieldValidationResult {
    if (height === undefined || height === null) {
      return { isValid: true }; // 任意項目
    }
    
    if (height <= 0) {
      return { isValid: false, error: '最高高さは0より大きい値を入力してください' };
    }
    
    if (height > 999.99) {
      return { isValid: false, error: '最高高さは999.99m以下で入力してください' };
    }
    
    return { isValid: true };
  }
  
  static validateArea(area: number | undefined, fieldName: string): FieldValidationResult {
    if (area === undefined || area === null) {
      return { isValid: true }; // 任意項目
    }
    
    if (area <= 0) {
      return { isValid: false, error: `${fieldName}は0より大きい値を入力してください` };
    }
    
    if (area > 999999.99) {
      return { isValid: false, error: `${fieldName}は999999.99㎡以下で入力してください` };
    }
    
    return { isValid: true };
  }
  
  static validateBuildingAreas(buildingArea: number | undefined, totalArea: number | undefined): FieldValidationResult {
    if (!buildingArea || !totalArea) {
      return { isValid: true }; // 片方または両方が未入力の場合はスキップ
    }
    
    if (buildingArea > totalArea) {
      return { isValid: false, error: '建築面積は延床面積以下である必要があります' };
    }
    
    return { isValid: true };
  }
}

// 財務情報のバリデーション
export class FinancialValidator {
  
  static validateAmount(amount: number | undefined, fieldName: string): FieldValidationResult {
    if (amount === undefined || amount === null) {
      return { isValid: true }; // 任意項目
    }
    
    if (amount < 0) {
      return { isValid: false, error: `${fieldName}は0以上の値を入力してください` };
    }
    
    if (amount > 999999999999) { // 1兆円未満
      return { isValid: false, error: `${fieldName}は999,999,999,999円以下で入力してください` };
    }
    
    return { isValid: true };
  }
  
  static validateSettlementDate(date: string | undefined): FieldValidationResult {
    if (!date) {
      return { isValid: true }; // 任意項目
    }
    
    const settlementDate = new Date(date);
    const today = new Date();
    
    // 未来の日付は警告のみ（エラーにはしない）
    if (settlementDate > today) {
      return { 
        isValid: true, 
        error: '未来の決済日が設定されています（警告）' 
      };
    }
    
    return { isValid: true };
  }
}

// 総合バリデーション関数
export class FormValidator {
  
  static validateProject(data: any): ValidationResult {
    const errors: string[] = [];
    
    // プロジェクト基本情報
    const nameResult = ProjectValidator.validateProjectName(data.project_name);
    if (!nameResult.isValid && nameResult.error) {
      errors.push(nameResult.error);
    }
    
    const statusResult = ProjectValidator.validateStatus(data.status);
    if (!statusResult.isValid && statusResult.error) {
      errors.push(statusResult.error);
    }
    
    const dateResult = ProjectValidator.validateInputDate(data.input_date);
    if (!dateResult.isValid && dateResult.error) {
      errors.push(dateResult.error);
    }
    
    // 顧客情報
    if (data.customer) {
      const ownerResult = CustomerValidator.validateOwnerName(data.customer.owner_name);
      if (!ownerResult.isValid && ownerResult.error) {
        errors.push(ownerResult.error);
      }
      
      const kanaResult = CustomerValidator.validateKana(data.customer.owner_kana, '施主フリガナ');
      if (!kanaResult.isValid && kanaResult.error) {
        errors.push(kanaResult.error);
      }
      
      const postalResult = CustomerValidator.validatePostalCode(data.customer.owner_zip);
      if (!postalResult.isValid && postalResult.error) {
        errors.push(postalResult.error);
      }
      
      const phoneResult = CustomerValidator.validatePhoneNumber(data.customer.owner_phone);
      if (!phoneResult.isValid && phoneResult.error) {
        errors.push(phoneResult.error);
      }
    }
    
    // 敷地情報
    if (data.site) {
      const addressResult = SiteValidator.validateAddress(data.site.address);
      if (!addressResult.isValid && addressResult.error) {
        errors.push(addressResult.error);
      }
      
      const areaResult = SiteValidator.validateLandArea(data.site.land_area);
      if (!areaResult.isValid && areaResult.error) {
        errors.push(areaResult.error);
      }
    }
    
    // 建物情報
    if (data.building) {
      const heightResult = BuildingValidator.validateMaxHeight(data.building.max_height);
      if (!heightResult.isValid && heightResult.error) {
        errors.push(heightResult.error);
      }
      
      const buildingAreaResult = BuildingValidator.validateArea(data.building.building_area, '建築面積');
      if (!buildingAreaResult.isValid && buildingAreaResult.error) {
        errors.push(buildingAreaResult.error);
      }
      
      const totalAreaResult = BuildingValidator.validateArea(data.building.total_area, '延床面積');
      if (!totalAreaResult.isValid && totalAreaResult.error) {
        errors.push(totalAreaResult.error);
      }
      
      const areasResult = BuildingValidator.validateBuildingAreas(
        data.building.building_area, 
        data.building.total_area
      );
      if (!areasResult.isValid && areasResult.error) {
        errors.push(areasResult.error);
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

// フォームフィールドのリアルタイムバリデーション用フック
export const useFieldValidation = () => {
  const validateField = (fieldName: string, value: any, additionalData?: any): FieldValidationResult => {
    switch (fieldName) {
      case 'project_name':
        return ProjectValidator.validateProjectName(value);
      case 'status':
        return ProjectValidator.validateStatus(value);
      case 'input_date':
        return ProjectValidator.validateInputDate(value);
      case 'owner_name':
        return CustomerValidator.validateOwnerName(value);
      case 'owner_kana':
        return CustomerValidator.validateKana(value, '施主フリガナ');
      case 'owner_zip':
        return CustomerValidator.validatePostalCode(value);
      case 'owner_phone':
        return CustomerValidator.validatePhoneNumber(value);
      case 'address':
        return SiteValidator.validateAddress(value);
      case 'land_area':
        return SiteValidator.validateLandArea(value);
      case 'max_height':
        return BuildingValidator.validateMaxHeight(value);
      case 'building_area':
        return BuildingValidator.validateArea(value, '建築面積');
      case 'total_area':
        return BuildingValidator.validateArea(value, '延床面積');
      default:
        return { isValid: true };
    }
  };
  
  return { validateField };
};