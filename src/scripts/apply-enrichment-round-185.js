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

    if (c.id === "glass-frog") {
      newC.characteristics = appendClean(
        c.characteristics,
        "Mặt bụng hoàn toàn trong suốt không có sắc tố, hiển thị tim đang co bóp và dạ dày. Gan được bao bọc bởi một lớp túi phản quang có mật độ tinh thể guanine siêu cao, hoạt động như các thấu kính phản xạ ánh sáng (mirror-coated sacs) giúp che giấu và ngụy trang hoàn hảo lượng máu đỏ tập trung khổng lồ bên trong."
      );
      newC.survival_method = appendClean(
        c.survival_method,
        "Thực hiện cơ chế ngụy trang trong suốt chủ động (active transparency camouflage) bằng cách rút và nén cô lập khoảng 89% đến 90% lượng hồng cầu tuần hoàn vào bên trong lá gan được tráng gương guanine phản quang khi ngủ ngày. Khi màn đêm buông xuống và chúng hoạt động trở lại, các hồng cầu được phóng thích lập tức vào máu mà không hề tạo ra bất kỳ cục máu đông huyết khối (blood clots) nào."
      );
      newC.unique_traits = appendClean(
        c.unique_traits,
        "Cơ chế cô lập và cô đặc hồng cầu tự nhiên tại gan mà không sinh huyết khối gây tắc nghẽn mạch máu, là một hiện tượng y sinh học vô giá đang được ứng dụng để nghiên cứu các liệu pháp chống đột quỵ và đông máu ở người. Sử dụng phương pháp hiển thị quang âm (photoacoustic microscopy) để theo dõi tuần hoàn hồng cầu thời gian thực mà không cần gây mê hay phẫu thuật."
      );

      newC.strengths = appendUniqueString(newC.strengths, "Khả năng ngụy trang trong suốt tăng từ 2 đến 3 lần khi ngủ ngày, giảm thiểu tối đa sự hấp thụ và phản xạ ánh sáng để vô hình trước động vật săn mồi.");
      newC.strengths = appendUniqueString(newC.strengths, "Hệ cơ tim và não bộ có khả năng phục hồi hoàn toàn sau pha thiếu oxy cực bộ tạm thời khi hồng cầu bị cô lập tại gan.");

      newC.weaknesses = appendUniqueString(newC.weaknesses, "Sự nhạy cảm cực cao của cơ chế hô hấp và hấp thụ nước qua da đối với các loại thuốc bảo vệ thực vật, hóa chất tổng hợp hoặc kim loại nặng trong môi trường suối.");
      newC.weaknesses = appendUniqueString(newC.weaknesses, "Nguy cơ tử vong cao do nấm Batrachochytrium dendrobatidis gây bệnh chytridiomycosis tàn phá cấu trúc keratin của da mỏng.");

      newC.fun_facts = appendUniqueString(newC.fun_facts, "Mặc dù có lớp da trong suốt để lộ nội tạng, xương của một số phân loài ếch thủy tinh lại có màu xanh ngọc bích độc đáo do tích tụ sắc tố biliverdin.");
      newC.fun_facts = appendUniqueString(newC.fun_facts, "Để bảo vệ trứng khỏi bị khô héo và các loài ký sinh trùng, ếch bố sẽ canh giữ ổ trứng dưới lá suốt nhiều ngày và thực hiện hành vi 'tưới nước' bằng cách đi tiểu trực tiếp lên trứng.");

      newC.sources = appendUniqueSource(newC.sources, {
        "url": "https://doi.org/10.1126/science.adn0235",
        "label": "Science - Glassfrog transparency mechanism via erythrocyte packing (2024)"
      });
      newC.sources = appendUniqueSource(newC.sources, {
        "url": "https://www.nature.com/articles/d41586-022-04474-7",
        "label": "Nature - How glass frogs turn transparent to hide their blood (2022)"
      });

    } else if (c.id === "superb-lyrebird") {
      newC.characteristics = appendClean(
        c.characteristics,
        "Chiếc syrinx đặc trưng nằm ở ngã ba khí quản-phế quản chỉ có 3 cặp cơ thanh quản (so với 4 cặp của các loài oscine khác), nhưng sở hữu khả năng co giãn linh động và điều chỉnh độ căng của màng nhĩ trong (membrana tympaniformis) với độ chính xác cơ học cực cao."
      );
      newC.survival_method = appendClean(
        c.survival_method,
        "Sử dụng kỹ thuật nhại tiếng kêu quấy nhiễu (deceptive mobbing mimicry) của đàn chim khác khi bị đe dọa trực tiếp bởi thú săn mồi hoặc để đánh lạc hướng bạn tình trong quá trình tán tỉnh, tạo ra một ảo ảnh âm thanh về một mối nguy hiểm khẩn cấp xung quanh."
      );
      newC.unique_traits = appendClean(
        c.unique_traits,
        "Hệ thần kinh trung ương có các hạt nhân não bộ (songbird nuclei) phóng đại đặc biệt phục vụ cho việc ghi nhớ và tái tạo âm thanh. Khả năng kiểm soát độc lập hai nguồn âm (bilateral vocal control) giúp chim đực hót ra hai tần số âm thanh hoàn toàn độc lập từ hai nhánh phế quản trái và phải cùng một lúc."
      );

      newC.strengths = appendUniqueString(newC.strengths, "Cơ quan syrinx hoạt động như một máy tổng hợp âm thanh (acoustic synthesizer) neuromuscular điều biến tự do tần số và biên độ để nhại lại các âm thanh cơ học phức tạp của con người như máy cưa, máy ảnh cơ.");
      newC.strengths = appendUniqueString(newC.strengths, "Khả năng chạy trốn siêu việt với vận tốc lên tới 15 km/h nhờ cặp cơ đùi chân phát triển vượt trội thích nghi đời sống thảm rừng.");

      newC.weaknesses = appendUniqueString(newC.weaknesses, "Hành vi đắp ụ đất trống và nhảy múa xòe đuôi lớn lộng lẫy thu hút nhiều sự chú ý của thú săn mồi ngoại lai như cáo đỏ (Vulpes vulpes) và mèo hoang.");
      newC.weaknesses = appendUniqueString(newC.weaknesses, "Giai đoạn học hót và hoàn thiện kho tàng âm thanh kéo dài nhiều năm khiến các con đực trẻ khó cạnh tranh lãnh thổ trong thời kỳ đầu.");

      newC.fun_facts = appendUniqueString(newC.fun_facts, "Chúng bắt chước tiếng báo động khẩn cấp chân thực đến mức các loài chim khác trong rừng lập tức bay đi ẩn nấp khi nghe tiếng chim đàn lia giả giọng.");
      newC.fun_facts = appendUniqueString(newC.fun_facts, "Chim đàn lia đực có thể dành hơn 4 tiếng mỗi ngày để nhảy múa phối hợp nhịp nhàng với bài hót nhại của mình trên các ụ đất tự đắp rộng tới 1 mét.");

      newC.sources = appendUniqueSource(newC.sources, {
        "url": "https://doi.org/10.1016/j.cub.2021.01.097",
        "label": "Current Biology - Deceptive vocal mimicry of mobbing flocks by male superb lyrebirds (2021)"
      });
      newC.sources = appendUniqueSource(newC.sources, {
        "url": "https://doi.org/10.1093/beheco/arr157",
        "label": "Behavioral Ecology - Mimicry and display behavior of superb lyrebird"
      });

    } else if (c.id === "trap-jaw-ant") {
      newC.characteristics = appendClean(
        c.characteristics,
        "Cặp hàm thẳng mở rộng 180 độ được khóa cứng bằng chốt khớp đầu-hàm, lưu trữ thế năng đàn hồi (elastic energy storage) khổng lồ trong các sợi cơ khép hàm và cấu trúc lớp vỏ chitin của đầu. Khi ngòi bẫy được nhả ra, cặp hàm đóng sập lại cực nhanh."
      );
      newC.survival_method = appendClean(
        c.survival_method,
        "Khi gặp mối nguy hiểm từ thú săn mồi lớn, chúng thực hiện cú nhảy thoát hiểm (escape jump) bằng cách dập mạnh hàm xuống nền đất cứng, lực phản chấn khổng lồ phóng toàn bộ cơ thể bay cao tới 8 cm và xa tới 40 cm khỏi vị trí nguy hiểm."
      );
      newC.unique_traits = appendClean(
        c.unique_traits,
        "Cơ chế sập hàm tự động (latch-mediated spring-actuated) đạt tốc độ đóng từ 35 đến 64 m/s (126-230 km/h) trong thời gian cực ngắn chỉ 0.13 mili giây (130 micro giây), tạo ra gia tốc sập hàm lên tới 100,000g."
      );

      newC.strengths = appendUniqueString(newC.strengths, "Lực va đập sập hàm cục bộ tạo ra năng lượng lớn gấp 300 đến 500 lần trọng lượng cơ thể, dễ dàng đập nát lớp vỏ chitin dày của các côn trùng đối thủ.");
      newC.strengths = appendUniqueString(newC.strengths, "Hệ cơ quan lông cảm giác (trigger hairs) siêu nhạy ở mép hàm kết nối trực tiếp với cung phản xạ thần kinh tốc độ cao giúp kích hoạt cú đớp tức thì.");

      newC.weaknesses = appendUniqueString(newC.weaknesses, "Mất kiểm soát chuyển động cơ thể tạm thời (nhào lộn hoặc văng xa vô định hướng) nếu thực hiện cú sập hàm trượt mồi trên bề mặt dốc.");
      newC.weaknesses = appendUniqueString(newC.weaknesses, "Mức tiêu hao năng lượng chuyển hóa để nạp lại chốt khóa và căng hệ cơ hàm cực kỳ lớn, giới hạn số lần tấn công liên tiếp.");

      newC.fun_facts = appendUniqueString(newC.fun_facts, "Tốc độ đóng hàm của kiến bẫy hàm nhanh gấp 2300 lần so với một cái chớp mắt của con người.");
      newC.fun_facts = appendUniqueString(newC.fun_facts, "Để xua đuổi các động vật xâm nhập tổ lớn, bầy kiến thợ sẽ thực hiện hành vi phòng thủ tập thể bằng cách cùng lúc đập mạnh hàm xuống đất để bắn mình vào đối thủ.");

      newC.sources = appendUniqueSource(newC.sources, {
        "url": "https://doi.org/10.1126/science.1130517",
        "label": "Science - High-speed videography of Odontomachus trap-jaw ants"
      });
      newC.sources = appendUniqueSource(newC.sources, {
        "url": "https://www.pnas.org/doi/full/10.1073/pnas.0601368103",
        "label": "PNAS - Jaw mechanism and escape jumps of trap-jaw ants"
      });

    } else if (c.id === "horseshoe-bat") {
      newC.characteristics = appendClean(
        c.characteristics,
        "Lá mũi (nose-leaf) có cấu trúc nếp thịt phức tạp hình móng ngựa phía dưới và một chiếc lá nhọn (lancet) phía trên, hoạt động như một loa khúc xạ âm học (acoustic lens) hội tụ chùm siêu âm tần số 83 kHz thành chùm hẹp 20 độ. Hệ cơ thanh quản đặc biệt có các sợi cơ siêu nhanh (superfast muscle fibers) cho phép phát xung CF liên tục."
      );
      newC.survival_method = appendClean(
        c.survival_method,
        "Săn mồi bằng cơ chế bù trừ dịch chuyển Doppler (Doppler Shift Compensation): dơi chủ động hạ tần số phát sóng khi bay tiến về phía trước để sóng phản hồi dội lại tai luôn cố định ở tần số nhạy bén nhất 83 kHz, giúp phân tích tốc độ bay của côn trùng."
      );
      newC.unique_traits = appendClean(
        c.unique_traits,
        "Sở hữu vùng acoustic fovea (fovea thính giác) trong ốc tai và vùng vỏ não thính giác (frequenotopic map) phóng đại chuyên biệt để xử lý các chi tiết tần số dội lại nhỏ nhất. Cơ chế này tạo ra một 'dải tần số yên tĩnh' ngay phía trên tần số tham chiếu để phát hiện chớp sóng âm (spectral glints) từ cánh côn trùng đang vẫy."
      );

      newC.strengths = appendUniqueString(newC.strengths, "Khả năng định vị sonar chính xác đến từng milimet trong không gian rậm rạp của thảm rừng ẩm ướt.");
      newC.strengths = appendUniqueString(newC.strengths, "Móng chân cấu tạo gân khóa tự động (tendon locking mechanism) giúp treo ngược cơ thể lên trần hang suốt nhiều tuần ngủ đông mà không tiêu tốn năng lượng cơ.");

      newC.weaknesses = appendUniqueString(newC.weaknesses, "Thiếu cấu trúc tragus (nắp tai) ở vành tai ngoài khiến việc xác định góc thẳng đứng (trục dọc) của con mồi tĩnh trở nên khó khăn hơn.");
      newC.weaknesses = appendUniqueString(newC.weaknesses, "Thính giác nhạy cảm cao độ dễ bị gây nhiễu và mất phương hướng bởi các nguồn tiếng ồn nhân tạo tần số cao từ máy móc công nghiệp.");

      newC.fun_facts = appendUniqueString(newC.fun_facts, "Trong thời gian ngủ đông dài, nhịp tim của dơi mũi móng ngựa có thể giảm sâu từ 400 nhịp/phút xuống chỉ còn 4 nhịp/phút để duy trì năng lượng tối thiểu.");
      newC.fun_facts = appendUniqueString(newC.fun_facts, "Đôi tai lớn của dơi có thể xoay độc lập 180 độ với tốc độ nhanh để thu tín hiệu phản hồi từ nhiều hướng khác nhau mà không cần chuyển động đầu.");

      newC.sources = appendUniqueSource(newC.sources, {
        "url": "https://doi.org/10.1121/1.4921603",
        "label": "JASA - Noseleaf dynamics in horseshoe bats"
      });
      newC.sources = appendUniqueSource(newC.sources, {
        "url": "https://doi.org/10.1007/s00359-011-0675-9",
        "label": "JCP - Doppler shift compensation mechanics in Rhinolophus"
      });

    } else if (c.id === "bullet-ant") {
      newC.characteristics = appendClean(
        c.characteristics,
        "Cơ thể lớn màu đen bóng, sở hữu ngòi châm (sting) nối liền tuyến nọc ở cuối bụng hoạt động như một kim tiêm thủy lực. Tuyến nọc độc chứa neurotoxin peptide Poneratoxin (PoTX) - một chuỗi gồm 25 axit amin (FLPLLILGSLLMTPPVIQAIHDAQR) có cấu trúc xoắn alpha kép kị nước."
      );
      newC.survival_method = appendClean(
        c.survival_method,
        "Kiếm ăn chủ động trên tán cây rừng mưa nhiệt đới. Thiết lập mối quan hệ sinh thái chặt chẽ với các loài cây có tuyến mật ngoài hoa (extrafloral nectaries). Khi gặp kẻ thù nguy hiểm, chúng phối hợp phát tín hiệu cảnh báo âm học qua cọ xát đốt bụng (stridulation) và giải phóng pheromone báo động nồng độ cao trước khi châm đốt hàng loạt."
      );
      newC.unique_traits = appendClean(
        c.unique_traits,
        "Độc tố Poneratoxin tác động chọn lọc lên các kênh natri nhạy cảm điện thế (voltage-gated sodium channels - NaV), ngăn chặn quá trình bất hoạt kênh và kéo dài điện thế hoạt động của tế bào thần kinh cảm giác đau, gây ra nỗi đau đớn khủng khiếp đạt điểm tuyệt đối 4.0+ trên thang Schmidt Sting Pain Index."
      );

      newC.strengths = appendUniqueString(newC.strengths, "Lớp tuyến sáp biểu bì (epicuticular wax layer) giàu hydrocarbon phân nhánh mạch dài cung cấp khả năng chống mất nước vượt trội.");
      newC.strengths = appendUniqueString(newC.strengths, "Cấu trúc khớp cổ tiến hóa cao cho phép kiến thợ nâng và mang vác vật nặng gấp 30 đến 50 lần trọng lượng cơ thể.");

      newC.weaknesses = appendUniqueString(newC.weaknesses, "Sự phụ thuộc sinh thái tuyệt đối vào các nectary ngoài hoa của cây rừng mưa nguyên sinh khiến chúng nhạy cảm cao với sự phân mảnh rừng.");
      newC.weaknesses = appendUniqueString(newC.weaknesses, "Cơ quan cảm ứng râu dễ bị tê liệt lâm thời dưới tác động của chấn động tần số thấp từ mặt đất.");

      newC.fun_facts = appendUniqueString(newC.fun_facts, "Kiến thợ có khả năng kẹp giữ các giọt mật lỏng siêu nhỏ giữa hai gọng hàm bằng sức căng bề mặt để vận chuyển về tổ cho ấu trùng mà không làm rơi vỡ giọt nước.");
      newC.fun_facts = appendUniqueString(newC.fun_facts, "Hợp chất Poneratoxin hiện đang được các nhà nghiên cứu phân tích để phát triển các loại thuốc giảm đau thần kinh thế hệ mới và thuốc bảo vệ thực vật sinh học chọn lọc.");

      newC.sources = appendUniqueSource(newC.sources, {
        "url": "https://doi.org/10.1016/j.toxicon.2015.06.012",
        "label": "Toxicon - Mass spectrometry mapping of Paraponera clavata peptidome"
      });
      newC.sources = appendUniqueSource(newC.sources, {
        "url": "https://doi.org/10.1016/j.jinsphys.2018.04.010",
        "label": "Journal of Insect Physiology - Epicuticular lipids and desiccation resistance in tropical forest ants"
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
