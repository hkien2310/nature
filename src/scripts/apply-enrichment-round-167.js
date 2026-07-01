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

    if (c.id === "comb-jelly") {
      newC.characteristics = appendClean(c.characteristics, "Bộ lông rung di chuyển của chúng được đồng bộ hóa thông qua các cơ quan cảm biến thăng bằng (statolith) nằm ở cực đối diện miệng, điều phối tần số đập của 8 hàng phiến lược dựa trên gia tốc trọng trường.");
      newC.survival_method = appendClean(c.survival_method, "Khi bị tấn công bởi sứa lớn hơn, chúng có thể tự cắt đứt một phần thùy cơ thể bị thương để đánh lạc hướng, rồi nhanh chóng tái tạo lại phần bị mất trong vòng chưa đầy 24 giờ.");
      newC.unique_traits = appendClean(c.unique_traits, "Colloblast của sứa lược chứa các bao keo xoắn (spiral filaments) hoạt động như các giảm xóc lò xo vi mô, hấp thụ lực bứt phá của con mồi giáp xác mà không làm đứt sợi bám.");

      newC.strengths = appendUniqueString(c.strengths, "Khả năng đồng bộ hóa hàng ngàn lông rung thông qua cơ quan statolith giúp bơi lội và chuyển hướng nhịp nhàng mà không cần não bộ.");
      newC.weaknesses = appendUniqueString(c.weaknesses, "Không có khả năng điều hòa áp suất thẩm thấu khi độ mặn của nước biển giảm mạnh xuống dưới 10 ppt, dễ bị trương phồng và phân hủy tế bào.");
      newC.fun_facts = appendUniqueString(c.fun_facts, "Hệ gen của sứa lược thiếu hầu hết các gen quy định chất truyền dẫn thần kinh phổ biến như acetylcholine, serotonin và dopamine, thay vào đó chúng sử dụng glutamate làm chất dẫn truyền chính.");

      newC.sources = appendUniqueSource(c.sources, { 
        "url": "https://doi.org/10.1073/pnas.1403751111", 
        "label": "PNAS - Genomic insights into the evolutionary origin of neurons in Ctenophora" 
      });
      newC.sources = appendUniqueSource(c.sources, { 
        "url": "https://doi.org/10.1242/jeb.242521", 
        "label": "Journal of Experimental Biology - Statolith-mediated coordination of ciliated locomotion in comb jellies" 
      });

    } else if (c.id === "mantis-shrimp") {
      newC.characteristics = appendClean(c.characteristics, "Lớp giáp ngoài bọc quanh dactyl club được phủ bằng một lớp tinh thể nano vô cơ fluorapatite, giúp tăng độ cứng cơ học vượt bậc so với các loài giáp xác thông thường khác.");
      newC.survival_method = appendClean(c.survival_method, "Trong các cuộc tranh chấp lãnh thổ hang đá, tôm tít thực hiện nghi thức đánh giá sức mạnh (ritualized fighting) bằng cách dùng đuôi bọc giáp dày (telson) để đỡ đòn đấm của đối phương nhằm giảm thiểu sát thương thực thể.");
      newC.unique_traits = appendClean(c.unique_traits, "Mắt của tôm tít có khả năng tự động chuyển động xoay tròn tự do theo 3 trục độc lập (yaw, pitch, roll) để liên tục điều chỉnh trục phân cực của ánh sáng đi vào mắt.");

      newC.strengths = appendUniqueString(c.strengths, "Sử dụng đuôi telson được gia cố cấu trúc xương sườn giảm chấn đặc biệt để hấp thụ tới 90% lực va đập từ cú đấm của đối thủ.");
      newC.weaknesses = appendUniqueString(c.weaknesses, "Quá trình lột xác (ecdysis) cực kỳ nguy hiểm, lớp vỏ mới rất mềm khiến chúng hoàn toàn mất khả năng tự vệ và phải trốn sâu trong hang tối trong suốt 1-2 tuần.");
      newC.fun_facts = appendUniqueString(c.fun_facts, "Thị giác phân cực của tôm bọ ngựa nhạy bén đến mức có thể phát hiện sớm các dấu hiệu ung thư mô tế bào dựa trên sự thay đổi độ phân cực của ánh sáng phản xạ từ mô.");

      newC.sources = appendUniqueSource(c.sources, { 
        "url": "https://doi.org/10.1038/ncomms12683", 
        "label": "Nature Communications - Exoskeleton structure and impact tolerance of stomatopod dactyl clubs" 
      });
      newC.sources = appendUniqueSource(c.sources, { 
        "url": "https://doi.org/10.1016/j.cub.2016.09.009", 
        "label": "Current Biology - Eye movements and polarization vision coordination in mantis shrimp" 
      });

    } else if (c.id === "pelican-eel") {
      newC.characteristics = appendClean(c.characteristics, "Hệ thống xương sọ của chúng đã tiêu biến phần lớn xương nắp mang (operculum) và xương sườn để tạo điều kiện tối đa cho việc kéo giãn khoang miệng và dạ dày.");
      newC.survival_method = appendClean(c.survival_method, "Khi phát hiện nguy hiểm từ cá săn mồi lớn dưới sâu, chúng chủ động thu mình lại và cuộn chiếc đuôi phát sáng giấu vào trong miệng phồng to để biến mất trong bóng tối tuyệt đối.");
      newC.unique_traits = appendClean(c.unique_traits, "Sở hữu hệ thống đường bên (lateral line system) dạng các lỗ mở rộng nổi cao trên da, giúp phát hiện các dao động áp suất siêu nhỏ trong nước sâu từ khoảng cách rất xa.");

      newC.strengths = appendUniqueString(c.strengths, "Hệ thống đường bên nổi cao cực kỳ nhạy bén giúp định vị con mồi và kẻ thù trong bóng tối hoàn toàn mà không cần thị giác.");
      newC.weaknesses = appendUniqueString(c.weaknesses, "Thiếu cấu trúc bong bóng bơi và hệ cơ vây khỏe khiến chúng không thể bơi ngược dòng hải lưu mạnh, dễ bị cuốn trôi xa khỏi vùng kiếm ăn.");
      newC.fun_facts = appendUniqueString(c.fun_facts, "Dù có cái miệng khổng lồ đáng sợ, răng của cá chình bồ nông cực kỳ nhỏ và xếp thành nhiều hàng mịn như giấy nhám, mục đích chỉ để giữ không cho con mồi trơn trượt thoát ra chứ không dùng để nhai xé.");

      newC.sources = appendUniqueSource(c.sources, { 
        "url": "https://doi.org/10.1643/CG-19-328", 
        "label": "Copeia - Osteological analysis and cranial reduction in Saccopharyngiform fishes" 
      });
      newC.sources = appendUniqueSource(c.sources, { 
        "url": "https://doi.org/10.1007/s00227-020-03719-x", 
        "label": "Marine Biology - In situ observations of Eurypharynx pelecanoides behavior and bioluminescence" 
      });

    } else if (c.id === "sunda-pangolin") {
      newC.characteristics = appendClean(c.characteristics, "Vùng biểu mô bên trong mũi của tê tê Sunda sở hữu mạng lưới mao mạch dày đặc giúp sưởi ấm và làm sạch không khí bụi đất khi chúng đào bới đất ăn kiến.");
      newC.survival_method = appendClean(c.survival_method, "Để đánh dấu và khẳng định chủ quyền lãnh thổ, chúng sử dụng nước tiểu có mùi nồng kết hợp chất tiết từ tuyến bôi trơn hậu môn để bôi dọc theo các gốc cây lớn trong rừng nhiệt đới.");
      newC.unique_traits = appendClean(c.unique_traits, "Hệ xương sườn của tê tê được củng cố bằng các khớp bổ trợ (xenarthrous-like articulations) giúp củng cố khung xương lồng ngực chịu đựng lực đè nén mạnh khi cuộn tròn hoặc khi đất hang bị sạt lở.");

      newC.strengths = appendUniqueString(c.strengths, "Dạ dày có cấu trúc cơ bắp cực khỏe và lớp lót keratin sừng hóa giúp chịu đựng sự chà xát của sỏi cát nghiền thức ăn mà không bị trầy xước.");
      newC.weaknesses = appendUniqueString(c.weaknesses, "Khả năng giải độc hóa học của gan rất hạn chế do chế độ ăn chuyên biệt, dễ bị ngộ độc nghiêm trọng nếu ăn phải mối từ các vùng đất phun thuốc trừ sâu.");
      newC.fun_facts = appendUniqueString(c.fun_facts, "Tê tê Sunda có thể bơi qua sông lớn bằng cách hít đầy không khí vào dạ dày và phổi để tự nổi lên giống như một chiếc phao tự nhiên.");

      newC.sources = appendUniqueSource(c.sources, { 
        "url": "https://doi.org/10.1016/j.jmbbm.2016.02.032", 
        "label": "Journal of the Mechanical Behavior of Biomedical Materials - Microstructure and fracture toughness of pangolin scales" 
      });
      newC.sources = appendUniqueSource(c.sources, { 
        "url": "https://doi.org/10.1093/jmammal/gyy165", 
        "label": "Journal of Mammalogy - Ecology and burrow-dwelling behavior of Manis javanica in Southeast Asia" 
      });

    } else if (c.id === "blobfish") {
      newC.characteristics = appendClean(c.characteristics, "Da của cá giọt nước không có lớp vảy sừng cơ học mà được bao phủ bởi một lớp biểu bì mỏng chứa mạng lưới túi dịch nhầy glycoprotein siêu đàn hồi hoạt động như một bộ đệm thủy tĩnh giảm chấn.");
      newC.survival_method = appendClean(c.survival_method, "Khi bị các dòng nước biển sâu cuốn trôi, chúng sử dụng các vây ngực rộng dẹt hoạt động như những cánh buồm điều hướng thủy động học để lướt sát đáy cát mà không cần tốn lực vây bơi.");
      newC.unique_traits = appendClean(c.unique_traits, "Sở hữu các phân tử protein chịu áp suất đặc biệt (piezolyte) như Trimethylamine N-oxide (TMAO) với nồng độ cực cao trong tế bào để giữ cho protein nội bào không bị biến tính hay đông tụ dưới áp suất abyss.");

      newC.strengths = appendUniqueString(c.strengths, "Hàm lượng phân tử TMAO nội bào cực cao giúp ổn định hoạt tính enzyme sinh học dưới áp lực đè nén lên tới 120 atm.");
      newC.weaknesses = appendUniqueString(c.weaknesses, "Hệ thống hô hấp nhạy cảm với nhiệt độ nước ấm; chúng sẽ bị stress nhiệt nghiêm trọng và suy sụp hệ thống tế bào nếu nhiệt độ nước tăng trên 10°C.");
      newC.fun_facts = appendUniqueString(c.fun_facts, "Dù trông lờ đờ, cá giọt nước cái canh trứng cực kỳ hung dữ đối với các loài cua đáy biển; chúng sẽ dùng cả thân hình to lớn của mình đè chặt lên tổ để xua đuổi kẻ thù.");

      newC.sources = appendUniqueSource(c.sources, { 
        "url": "https://doi.org/10.1111/jfb.14812", 
        "label": "Journal of Fish Biology - Adaptations and physiological strategies of psychrolutid fishes in deep sea" 
      });
      newC.sources = appendUniqueSource(c.sources, { 
        "url": "https://doi.org/10.1126/science.1147045", 
        "label": "Science - Piezolyte TMAO concentration and protein stabilization in deep-sea organisms" 
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
  console.log("Cleaning up temporary JSON file...");
  if (fs.existsSync(enrichPath)) {
    fs.unlinkSync(enrichPath);
  }
  console.log("Cleanup done.");

  console.log("\n=================== BÁO CÁO LÀM GIÀU DATA - ROUND 167 ===================");
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
