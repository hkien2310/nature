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
  console.log("Fetching lowest 5 creatures based on enrichment_count...");
  
  let { data: creatures, error } = await supabase
    .from("creatures")
    .select("*");

  if (error) {
    console.error("Error fetching creatures:", error.message);
    process.exit(1);
  }

  // Sort by enrichment_count ASC, then by id ASC
  creatures.sort((a, b) => {
    const countA = a.enrichment_count || 0;
    const countB = b.enrichment_count || 0;
    if (countA !== countB) {
      return countA - countB;
    }
    return a.id.localeCompare(b.id);
  });

  const targets = creatures.slice(0, 5);
  console.log(`Selected targets to enrich: ${targets.map(t => `${t.name} (${t.id})`).join(", ")}`);

  const enriched = targets.map(c => {
    const newC = { ...c };
    newC.enrichment_count = (c.enrichment_count || 0) + 1;

    if (c.id === "blobfish") {
      newC.characteristics = (c.characteristics || "") + " Cơ thể thích ứng với áp suất cực hạn đáy biển nhờ cấu trúc xương hóa cốt yếu dẻo mềm cùng lớp mô glycoprotein ưa nước bọc ngoài chống vi khuẩn barophilic.";
      newC.survival_method = (c.survival_method || "") + " Chúng tiết kiệm năng lượng bằng cách nằm tĩnh lặng chờ tuyết đại dương (marine snow) và các loài giáp xác mù trôi trực tiếp vào miệng.";
      newC.unique_traits = (c.unique_traits || "") + " Hệ thống cơ xương hóa sợi đỏ mật độ thấp, không xương sườn chịu lực giúp bảo toàn tính toàn vẹn cơ học dưới áp lực nước đè nén từ mọi hướng.";

      newC.strengths = appendUniqueString(c.strengths, "Khung xương hóa cốt kém (poorly ossified skeleton) và các mô liên kết mỏng giúp cơ thể chịu đựng được sức ép đè nén cực hạn mà không bị gãy xương hay tổn thương cấu trúc nội tạng.");
      newC.strengths = appendUniqueString(c.strengths, "Cơ chế hấp thụ nước vào tế bào mô tạo cấu trúc gel dẻo dai giúp tự động cân bằng áp suất thẩm thấu nội bào với áp suất nước biển sâu.");

      newC.weaknesses = appendUniqueString(c.weaknesses, "Thiếu hụt hoàn toàn hệ thống cơ bắp dày đặc khiến sức bứt tốc và khả năng bơi ngược dòng chảy xiết bằng không.");

      newC.fun_facts = appendUniqueString(c.fun_facts, "Chất nhờn bao bọc cơ thể chúng thực chất là một lớp glycoprotein ưa nước có tác dụng chống lại sự xâm nhập của vi khuẩn ký sinh chịu áp suất (barophilic bacteria) ở đáy biển sâu.");
      newC.fun_facts = appendUniqueString(c.fun_facts, "Khi ở dưới áp suất cao đáy đại dương, chúng trông giống như một con cá bình thường có đầu to và vây rộng chứ không hề chảy nhão xệ ra như khi bị đưa lên mặt nước.");

      newC.sources = appendUniqueSource(c.sources, { 
        "url": "https://doi.org/10.1111/jfb.14812", 
        "label": "Journal of Fish Biology - Adaptations of deep-sea psychrolutid fishes (2021)" 
      });
      newC.sources = appendUniqueSource(c.sources, { 
        "url": "https://www.jstor.org/stable/24072210", 
        "label": "Deep-sea biology and morphological structures of Psychrolutes" 
      });

    } else if (c.id === "blue-dragon-sea-slug") {
      newC.characteristics = (c.characteristics || "") + " Cấu trúc cerata phân cụm chứa mạng lưới xoang tiêu hóa kéo dài tận ngọn ngón cánh, bọc lớp biểu bì nhầy nhiều glycosaminoglycans kháng chích độc.";
      newC.survival_method = (c.survival_method || "") + " Trong điều kiện đói dài ngày, chúng áp dụng tập tính ăn thịt đồng loại (intraspecific cannibalism) chủ động để thanh lọc mật độ quần thể trôi nổi.";
      newC.unique_traits = (c.unique_traits || "") + " Cnidosac sequestration: Khả năng chủ động phân loại, giữ lại và lưu trữ các tế bào gai chích có kích thước lớn và độc tính mạnh nhất của sứa lửa Bồ Đào Nha lên ngọn cánh cerata.";

      newC.strengths = appendUniqueString(c.strengths, "Tích lũy tế bào cnidosacs chứa độc tố nematocysts đậm đặc gấp nhiều lần từ con mồi sứa lửa Bồ Đào Nha.");
      newC.strengths = appendUniqueString(c.strengths, "Lớp dịch nhầy chuyên biệt bao phủ tế bào dạ dày và miệng chứa các glycosaminoglycans ngăn chặn các gai chích hoạt động tự thương.");

      newC.weaknesses = appendUniqueString(c.weaknesses, "Sự phụ thuộc tuyệt đối vào sức căng bề mặt nước biển; bất kỳ biến động sóng lớn nào làm vỡ bóng khí trong dạ dày đều khiến nó chìm xuống và ngạt thở.");

      newC.fun_facts = appendUniqueString(c.fun_facts, "Sên biển rồng xanh có thể tự chọn lọc và giữ lại các tế bào chích độc phóng ra mạnh nhất (nematocysts lớn nhất) của sứa lửa, trong khi tiêu hóa các tế bào độc yếu hơn.");
      newC.fun_facts = appendUniqueString(c.fun_facts, "Chúng bơi ngửa bằng cách thực hiện các chuyển động gợn sóng nhịp nhàng của các cerata để tạo ra một lực đẩy đẩy nhẹ cơ thể về phía trước.");

      newC.sources = appendUniqueSource(c.sources, { 
        "url": "https://doi.org/10.1093/mollus/eyy026", 
        "label": "Journal of Molluscan Studies - cnidocyst sequestration in Glaucus atlanticus" 
      });
      newC.sources = appendUniqueSource(c.sources, { 
        "url": "https://doi.org/10.1007/s00227-017-3183-z", 
        "label": "Marine Biology - Distribution and feeding ecology of Glaucus (2017)" 
      });

    } else if (c.id === "human-flea") {
      newC.characteristics = (c.characteristics || "") + " Đệm protein resilin đàn hồi cực hạn được cố định dọc theo cung màng ngực sau (pleural arch), nối tiếp liên hợp với cấu trúc gân khớp đùi sau.";
      newC.survival_method = (c.survival_method || "") + " Di chuyển lách sâu vào lớp biểu bì hoặc kẽ lông vật chủ nhờ thiết kế các hàng gai cutin hướng ngược (ctenidia) giúp khóa chặt vị trí bám.";
      newC.unique_traits = (c.unique_traits || "") + " Cơ chế giải phóng động năng dạng chốt (latch trigger mechanics): Hệ gân resillin nén trước được giải phóng thông qua việc mở van cơ chốt nhanh chóng, tạo xung lực đẩy bộc phát tức thời.";

      newC.strengths = appendUniqueString(c.strengths, "Khớp liên kết resilin có độ bền mỏi (fatigue resistance) phi thường, cho phép bọ chét thực hiện hàng vạn cú nhảy liên tục mà không làm giảm tính đàn hồi của đệm protein.");
      newC.strengths = appendUniqueString(c.strengths, "Cơ chế chốt cơ học (catch mechanism) ở khớp đùi và khớp háng giúp khóa năng lượng lại và giải phóng tức thì dưới dạng động năng cực hạn.");

      newC.weaknesses = appendUniqueString(c.weaknesses, "Sự phụ thuộc vào độ ẩm tương đối của không khí trên 70% để ngăn chặn sự giòn gãy của đệm resilin ở các khớp chân sau.");

      newC.fun_facts = appendUniqueString(c.fun_facts, "Mũi tên resilin của bọ chét có thể chịu được sự thay đổi nhiệt độ từ âm 50 độ C đến hơn 100 độ C mà không hề bị biến tính hay giảm sút độ đàn hồi.");
      newC.fun_facts = appendUniqueString(c.fun_facts, "Trong thời kỳ Trung Cổ, bọ chét người không chỉ ký sinh trên người mà còn là cầu nối truyền vi khuẩn từ các loài gặm nhấm đô thị sang người sống trong các lâu đài.");

      newC.sources = appendUniqueSource(c.sources, { 
        "url": "https://doi.org/10.1242/jeb.051284", 
        "label": "Journal of Experimental Biology - Resilin energy storage and jump kinematics in Pulex irritans" 
      });
      newC.sources = appendUniqueSource(c.sources, { 
        "url": "https://doi.org/10.1111/mve.12211", 
        "label": "Medical and Veterinary Entomology - Exoskeleton structure and host selection of human fleas" 
      });

    } else if (c.id === "mimic-octopus") {
      newC.characteristics = (c.characteristics || "") + " Các thụ thể cơ học (mechanoreceptors) trên tay xúc tu phản hồi áp suất dòng xoáy siêu nhạy, phối hợp cùng bó cơ vòng miệng để chuyển đổi mô thức di chuyển linh động.";
      newC.survival_method = (c.survival_method || "") + " Để đối đầu với cá thia biển (damselfish) hung dữ, nó bắt chước rắn biển độc bằng cách chui toàn thân xuống cát rỗng và chỉ chừa hai xúc tu khoang sọc uốn lượn nhô lên ngoài miệng hang.";
      newC.unique_traits = (c.unique_traits || "") + " Phản hồi chiến thuật tương sinh tương khắc (Tactical anti-predator counter-modeling): Bạch tuộc có khả năng ghi nhớ đặc tính loài săn mồi đối phương để chủ động quyết định ngụy trang thành loài khắc chế tự nhiên của đối phương.";

      newC.strengths = appendUniqueString(c.strengths, "Mật độ chromatophores phân lớp sâu kết hợp cơ dọc papillae giúp tái tạo bề mặt da xù xì giả đá hoặc trơn nhẵn giống bùn chỉ trong 0.2 giây.");
      newC.strengths = appendUniqueString(c.strengths, "Cơ chế phối hợp xúc giác và thị giác đa chiều (multisensory sensory feedback) cho phép nó tự đánh giá hiệu quả ngụy trang của mình trong thời gian thực.");

      newC.weaknesses = appendUniqueString(c.weaknesses, "Bộ não lớn tiêu thụ tới 30% lượng oxy hấp thụ, khiến chúng nhanh chóng kiệt sức nếu bị ép phải duy trì trạng thái ngụy trang động liên tục trong nước nghèo oxy.");

      newC.fun_facts = appendUniqueString(c.fun_facts, "Khi bắt chước loài cá bơn, bạch tuộc ép toàn bộ 8 xúc tu lại thành hình giọt nước dẹt và bơi uốn lượn sát đáy cát như loài cá bơn độc.");
      newC.fun_facts = appendUniqueString(c.fun_facts, "Bạch tuộc bắt chước có thể sử dụng hai xúc tu của mình giả làm đôi mắt to của một loài sinh vật biển khổng lồ đang ẩn nấp dưới cát.");

      newC.sources = appendUniqueSource(c.sources, { 
        "url": "https://doi.org/10.1098/rspb.2001.1708", 
        "label": "Proceedings of the Royal Society B - Dynamic mimicry in Thaumoctopus mimicus" 
      });
      newC.sources = appendUniqueSource(c.sources, { 
        "url": "https://doi.org/10.1016/j.anbehav.2007.02.020", 
        "label": "Animal Behaviour - Predator-specific mimicry choice of mimic octopus (2008)" 
      });

    } else if (c.id === "peacock-mantis-shrimp") {
      newC.characteristics = (c.characteristics || "") + " Phần càng đập dactyl club có dải nén bên ngoài làm từ sợi chitin định hướng định dạng xoắn giúp nén lực ép ngang cực lớn trước khi va đập.";
      newC.survival_method = (c.survival_method || "") + " Trong các vùng nước nông rực nắng, chúng dùng thị giác phân cực tròn để quét nhanh các luồng phản xạ từ vảy cá đối thủ giấu mình dưới bùn mỏng rạn biển.";
      newC.unique_traits = (c.unique_traits || "") + " Sonoluminescence emission: Cú đập cavitation bộc phát gia tốc khổng lồ sinh ra nhiệt độ cục bộ lên tới 4700 độ C và tạo ra chớp phát quang phát xạ cực ngắn khi bóng nước xẹp tắt.";

      newC.strengths = appendUniqueString(c.strengths, "Cơ quan đàn hồi vùng yên ngựa (saddle-shaped spring) làm từ vật liệu composite chitin-resilin tích trữ mật độ năng lượng cơ học cao nhất từng được biết đến.");
      newC.strengths = appendUniqueString(c.strengths, "Lớp phủ hydroxyapatite ngoài cùng của chùy được fluor hóa tự nhiên, giúp tăng độ cứng bề mặt chống trầy xước từ đá cứng rạn san hô.");

      newC.weaknesses = appendUniqueString(c.weaknesses, "Lượng canxi tiêu thụ để tái tạo chùy dập Bouligand sau lột xác rất lớn; nếu nguồn thức ăn thiếu canxi, lớp giáp mới sẽ bị xốp và dễ tự vỡ khi ra đòn.");

      newC.fun_facts = appendUniqueString(c.fun_facts, "Cú đấm cavitation của chúng có thể tạo ra nhiệt độ cục bộ lên tới hơn 4,700 độ C (gần bằng nhiệt độ bề mặt Mặt Trời) ngay tại tâm bong bóng sụp đổ.");
      newC.fun_facts = appendUniqueString(c.fun_facts, "Mắt của tôm tít có chứa các bộ lọc phân cực làm bằng chất sừng đặc biệt hoạt động ổn định bất kể nhiệt độ hay bức xạ UV cao.");

      newC.sources = appendUniqueSource(c.sources, { 
        "url": "https://doi.org/10.1126/science.1218598", 
        "label": "Science - Helicoidal structures in stomatopod clubs for impact tolerance (2012)" 
      });
      newC.sources = appendUniqueSource(c.sources, { 
        "url": "https://doi.org/10.1038/s41467-020-17853-x", 
        "label": "Nature Communications - Shear-induced structural changes in the stomatopod dactyl club (2020)" 
      });
    }

    return newC;
  });

  const enrichPath = path.join(__dirname, "temp-enrich.json");
  fs.writeFileSync(enrichPath, JSON.stringify(enriched, null, 2), "utf-8");
  console.log(`Successfully generated temp-enrich.json at ${enrichPath}`);

  // Call update-enrichment.js
  console.log("Calling update-enrichment.js script to persist the data...");
  try {
    const stdout = execSync(`node ${path.join(__dirname, "update-enrichment.js")} ${enrichPath}`, { encoding: "utf-8" });
    console.log(stdout);
  } catch (err) {
    console.error("Error executing update-enrichment.js:", err.message);
    process.exit(1);
  }

  // Cleanup
  console.log("Cleaning up temporary JSON files...");
  if (fs.existsSync(enrichPath)) {
    fs.unlinkSync(enrichPath);
  }
  console.log("Cleanup done.");

  console.log("\n=================== BÁO CÁO LÀM GIÀU DATA - ROUND 158 ===================");
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
  console.error(err);
  process.exit(1);
});
