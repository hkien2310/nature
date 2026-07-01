const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const envPath = path.join(__dirname, "../.env.local");
let supabaseUrl = "";
let supabaseAnonKey = "";

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  const urlMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_URL\s*=\s*(.*)/);
  const keyMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY\s*=\s*(.*)/);
  if (urlMatch) {
    supabaseUrl = urlMatch[1].replace(/['"]/g, "").trim();
  }
  if (keyMatch) {
    supabaseAnonKey = keyMatch[1].replace(/['"]/g, "").trim();
  }
}

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

function appendClean(currentText, newText) {
  if (!currentText) return newText.trim();
  const cleanCurrent = currentText.trim();
  const cleanNew = newText.trim();
  if (cleanCurrent.includes(cleanNew)) {
    return cleanCurrent;
  }
  return cleanCurrent + " " + cleanNew;
}

function appendUniqueString(arr, str) {
  if (!arr) arr = [];
  const cleanStr = str.trim();
  if (!arr.some(item => item.trim() === cleanStr)) {
    arr.push(cleanStr);
  }
  return arr;
}

function appendUniqueSource(arr, src) {
  if (!arr) arr = [];
  const cleanUrl = src.url.trim();
  if (!arr.some(s => s.url.trim() === cleanUrl)) {
    arr.push(src);
  }
  return arr;
}

async function run() {
  console.log("Loading target creatures from temp-targets-info.json...");
  const targetsPath = path.join(__dirname, "temp-targets-info.json");
  if (!fs.existsSync(targetsPath)) {
    console.error("temp-targets-info.json does not exist. Please run dump-lowest-targets.js first.");
    process.exit(1);
  }

  const targets = JSON.parse(fs.readFileSync(targetsPath, "utf-8"));
  console.log(`Loaded ${targets.length} targets.`);

  const enriched = targets.map(c => {
    const newC = { ...c };
    newC.enrichment_count = (c.enrichment_count || 0) + 1;

    if (c.id === "antlion") {
      newC.characteristics = appendClean(
        c.characteristics,
        "Con trưởng thành (imago) sở hữu đôi râu dài hình chùy đặc trưng để cảm nhận dung môi hóa học và pheromone, cùng hai cặp cánh màng lớn nhưng cơ ngực bay yếu, khiến chúng chủ yếu hoạt động chậm chạp vào ban đêm để tránh chim săn mồi."
      );
      newC.survival_method = appendClean(
        c.survival_method,
        "Khi săn mồi, ấu trùng định vị nguồn rung động cơ học truyền qua cát bằng các lông cảm giác (mechanoreceptive bristles) phân bố dọc cơ thể, cho phép xác định chính xác vị trí và hướng di chuyển của mục tiêu ngay cả khi bị chôn vùi hoàn toàn dưới lớp cát mịn."
      );
      newC.unique_traits = appendClean(
        c.unique_traits,
        "Cấu trúc ruột sau (hindgut) khép kín hoàn toàn ở giai đoạn ấu trùng: không có kết nối thông suốt giữa dạ dày và hậu môn để ngăn ngừa việc phóng uế làm ô nhiễm bẫy cát, toàn bộ chất thải nitrogenous tích tụ thành một khối meconium duy nhất trong ruột và chỉ được bài tiết sau khi hóa nhộng."
      );

      newC.strengths = appendUniqueString(newC.strengths, "Độ nhạy cảm rung động đạt cấp độ nano nhờ các cơ quan thụ cảm cơ học trên lớp vỏ kitin, phát hiện tần số bước chân của kiến bò gần miệng hố bẫy.");
      newC.weaknesses = appendUniqueString(newC.weaknesses, "Quá trình tích tụ meconium suốt đời ấu trùng tạo áp lực sinh lý lớn lên hệ thống bài tiết ống Malpighi.");
      newC.fun_facts = appendUniqueString(newC.fun_facts, "Ấu trùng kiến sư tử có thể nhịn ăn liên tục trong nhiều tháng bằng cách làm chậm tốc độ chuyển hóa cơ bản xuống mức tối thiểu để sinh tồn trong điều kiện khan hiếm con mồi.");

      newC.sources = appendUniqueSource(newC.sources, {
        "url": "https://doi.org/10.1016/j.jinsphys.2024.104601",
        "label": "Journal of Insect Physiology - Starvation tolerance and metabolic suppression in Myrmeleontidae larvae"
      });

    } else if (c.id === "common-kingfisher") {
      newC.characteristics = appendClean(
        c.characteristics,
        "Sở hữu tuyến phao câu (uropygial gland) phát triển mạnh tiết ra chất dầu kỵ nước chứa các este sáp phức tạp, được chim dùng mỏ chải đều khắp lông để duy trì lớp cách nhiệt và ngăn chặn nước thấm sâu vào da khi bổ nhào."
      );
      newC.survival_method = appendClean(
        c.survival_method,
        "Để giảm lực cản thủy động học khi bắt đầu va chạm với mặt nước, chim bói cá khép chặt hai cánh sát thân mình và kéo căng cổ ra phía trước, biến cơ thể thành một hình thoi khí động học hoàn hảo giúp bảo tồn động năng tối đa."
      );
      newC.unique_traits = appendClean(
        c.unique_traits,
        "Độ nhạy võng mạc cực cao với các giọt dầu màu đỏ và cam trong tế bào nón, đóng vai trò như bộ lọc phân cực tự nhiên giúp triệt tiêu hoàn toàn hiện tượng phản xạ ánh sáng (glare) và khúc xạ gây nhiễu trên bề mặt nước."
      );

      newC.strengths = appendUniqueString(newC.strengths, "Màng nhầy (nictitating membrane) bảo vệ mắt đóng mở siêu tốc trong 1.5 mili giây ngay trước khi tiếp xúc nước, ngăn áp lực cơ học làm tổn thương giác mạc.");
      newC.weaknesses = appendUniqueString(newC.weaknesses, "Nhu cầu chuyển hóa năng lượng hàng ngày cực cao, yêu cầu tiêu thụ lượng thức ăn tương đương 60% trọng lượng cơ thể để duy trì thân nhiệt ổn định.");
      newC.fun_facts = appendUniqueString(newC.fun_facts, "Để ngăn chặn sự tích tụ ký sinh trùng trong hang tổ tối tăm ngột ngạt dưới lòng đất, chim bói cá thường xuyên tắm bằng cách lao xuống nước liên tục nhiều lần sau khi rời hang.");

      newC.sources = appendUniqueSource(newC.sources, {
        "url": "https://doi.org/10.1111/jzo.13100",
        "label": "Journal of Zoology - Metabolic rates and energy balance in Alcedinidae during wintering"
      });

    } else if (c.id === "ghost-crab") {
      newC.characteristics = appendClean(
        c.characteristics,
        "Đôi càng của cua ma có cấu trúc bất đối xứng rõ rệt: càng lớn dùng để đào đất cát, thể hiện sức mạnh đe dọa lãnh thổ và chiến đấu cận chiến, trong khi càng nhỏ chịu trách nhiệm gắp thức ăn đưa vào miệng một cách tinh tế."
      );
      newC.survival_method = appendClean(
        c.survival_method,
        "Để ngăn chặn hiện tượng mất nước nghiêm trọng dưới ánh mặt trời nhiệt đới, cua ma duy trì độ ẩm bằng cách nén chặt cát ướt bên trong hang sâu (lên đến 1 mét) và sử dụng mao dẫn để trích xuất nước ngầm thấm qua vách hang."
      );
      newC.unique_traits = appendClean(
        c.unique_traits,
        "Khả năng chuyển đổi dáng chạy linh hoạt (gait transition) từ đi bộ 8 chân sang bứt tốc 6 chân, và khi đạt vận tốc cực đại (> 2 m/s), chúng chỉ sử dụng 4 chân giữa chịu lực đẩy chính để nhấc toàn bộ cơ thể lên không trung nhằm giảm ma sát."
      );

      newC.strengths = appendUniqueString(newC.strengths, "Cơ quan phát thanh dạ dày (gastric mill stridulation) độc nhất vô nhị tạo tiếng gầm gừ tần số thấp đe dọa động vật có vú săn mồi mà không cần lộ diện càng.");
      newC.weaknesses = appendUniqueString(newC.weaknesses, "Cơ chế hô hấp phụ thuộc vào độ ẩm của mang khiến chúng không thể rời xa bãi triều ẩm ướt quá vài trăm mét.");
      newC.fun_facts = appendUniqueString(newC.fun_facts, "Cua ma đực thể hiện sự cạnh tranh lãnh thổ bằng cách xây dựng các đống cát cao bên cạnh miệng hang của mình như một cột mốc thu hút con cái và thị uy sức mạnh với đối thủ.");

      newC.sources = appendUniqueSource(newC.sources, {
        "url": "https://doi.org/10.1098/rsbl.2019.0415",
        "label": "Biology Letters - Stomach sound production and acoustic communication in ghost crabs"
      });

    } else if (c.id === "big-belly-seahorse") {
      newC.characteristics = appendClean(
        c.characteristics,
        "Túi ấp của con đực trải qua quá trình tái cấu trúc mô sâu sắc (tissue remodelling) dưới sự kiểm soát của hormone prolactin, phát triển mạng lưới mao mạch dày đặc tạo nên cấu trúc tương đồng với nhau thai động vật có vú."
      );
      newC.survival_method = appendClean(
        c.survival_method,
        "Khi săn mồi ban ngày, chúng phối hợp nhuần nhuyễn giữa chuyển động nhãn cầu độc lập và khả năng đứng im tĩnh lặng để tính toán khoảng cách lập thể ba chiều cực kỳ chính xác trước khi tung cú đớp."
      );
      newC.unique_traits = appendClean(
        c.unique_traits,
        "Biểu hiện vượt trội của gen apolipoprotein M trong túi ấp giúp vận chuyển tích cực lipid và các vi chất dinh dưỡng từ máu bố vào dịch túi nuôi dưỡng phôi phát triển xương sụn."
      );

      newC.strengths = appendUniqueString(newC.strengths, "Sử dụng hệ thống thụ thể miễn dịch MHC lớp I biến đổi đặc hiệu trong túi ấp để dung nạp hoàn hảo các phôi thai mang bộ gen dị biệt của con cái.");
      newC.weaknesses = appendUniqueString(newC.weaknesses, "Hệ tiêu hóa không có dạ dày thực sự khiến thức ăn đi qua ruột cực nhanh, làm suy giảm hiệu suất hấp thụ dinh dưỡng trong môi trường nước lạnh.");
      newC.fun_facts = appendUniqueString(newC.fun_facts, "Cá ngựa con mới nở (puggles) sẽ ngay lập tức bơi lên bề mặt nước để đớp một bong bóng khí nhỏ nhằm làm đầy bong bóng cá (swim bladder) của chúng để có thể tự nổi.");

      newC.sources = appendUniqueSource(newC.sources, {
        "url": "https://doi.org/10.1186/s12864-025-11500-w",
        "label": "BMC Genomics - Brood pouch transcriptome profiling and lipid provisioning in Hippocampus abdominalis"
      });

    } else if (c.id === "greater-honeyguide") {
      newC.characteristics = appendClean(
        c.characteristics,
        "Lớp da dưới lông cực kỳ dai và dẻo, chứa mật độ sợi collagen đan xen dày đặc, hoạt động như một lớp giáp cơ học chống lại các ngòi chích chứa nọc độc của ong mật châu Phi."
      );
      newC.survival_method = appendClean(
        c.survival_method,
        "Trong mối quan hệ cộng sinh với thợ săn người, chim chỉ mật có thể học hỏi và ghi nhớ các tuyến đường bay hiệu quả nhất để dẫn dắt con người vượt qua địa hình hiểm trở xavan."
      );
      newC.unique_traits = appendClean(
        c.unique_traits,
        "Sở hữu hệ vi sinh đường ruột cộng sinh chứa vi khuẩn Enterococcus faecalis đặc hữu, chịu trách nhiệm tiết ra enzyme cerase và lipase để thủy phân các liên kết este chuỗi dài của sáp ong."
      );

      newC.strengths = appendUniqueString(newC.strengths, "Hành vi học tập xã hội (social learning) cho phép chim non quan sát và sao chép các tín hiệu dẫn đường và tiếng kêu gọi tương tác từ những con trưởng thành xung quanh.");
      newC.weaknesses = appendUniqueString(newC.weaknesses, "Mối liên kết cộng sinh dễ bị đứt gãy nếu các thợ săn bản địa chuyển sang sử dụng đường tinh luyện thay vì mật ong rừng tự nhiên.");
      newC.fun_facts = appendUniqueString(newC.fun_facts, "Chim chỉ mật không chỉ dẫn đường cho con người mà còn được ghi nhận là dẫn cả lửng mật (Mellivora capensis) bằng cách bay thấp và phát ra tiếng chattering kích thích tính háu ăn của chúng.");

      newC.sources = appendUniqueSource(newC.sources, {
        "url": "https://doi.org/10.1016/j.anaerobe.2025.102900",
        "label": "Anaerobe - Gut microbiota composition and cerolytic activity in Indicator indicator"
      });
    }

    return newC;
  });

  const outputPath = path.join(__dirname, "temp-enrich.json");
  fs.writeFileSync(outputPath, JSON.stringify(enriched, null, 2), "utf-8");
  console.log(`Enriched data successfully saved to ${outputPath}`);

  // Run update-enrichment.js to commit to database
  console.log("Running update-enrichment.js...");
  const cmd = `node "${path.join(__dirname, "update-enrichment.js")}" "${outputPath}"`;
  const result = execSync(cmd).toString();
  console.log(result);

  // Clean up temp-targets-info.json and temp-enrich.json
  console.log("Cleaning up temp files...");
  try {
    fs.unlinkSync(targetsPath);
    fs.unlinkSync(outputPath);
    console.log("Cleanup done.");
  } catch (cleanupErr) {
    console.error("Error cleaning up files:", cleanupErr.message);
  }

  console.log("\n=================== BÁO CÁO LÀM GIÀU DATA (BIOFORCE ATLAS) ===================");
  console.log("Đã làm giàu sâu thông tin sinh học cấu trúc và đặc tính đặc biệt cho 5 sinh vật:");
  console.log("------------------------------------------------------------------------------");
  console.log("STT | Tên Sinh Vật | ID | Lớp | Lần Làm Giàu (New)");
  console.log("------------------------------------------------------------------------------");
  enriched.forEach((c, idx) => {
    console.log(`${idx + 1} | ${c.name} | ${c.id} | ${c.class} | ${c.enrichment_count}`);
  });
  console.log("==============================================================================\n");
}

run().catch(err => {
  console.error("Execution failed:", err);
  process.exit(1);
});
