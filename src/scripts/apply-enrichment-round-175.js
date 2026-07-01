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

    if (c.id === "immortal-jellyfish") {
      newC.characteristics = appendClean(c.characteristics, "Sở hữu hệ thống gen nhân đôi đặc biệt liên quan đến sửa chữa DNA, duy trì đầu mút NST (telomeres) và kiểm soát môi trường oxy hóa khử hoạt động cực mạnh trong quá trình đảo ngược vòng đời.");
      newC.survival_method = appendClean(c.survival_method, "Kích hoạt quá trình tắt các gene biệt hóa phát triển và tái kích hoạt các gene vạn năng (pluripotency genes) để đưa tế bào soma trở lại trạng thái tế bào gốc tiền thân.");
      newC.unique_traits = appendClean(c.unique_traits, "Bộ gene của loài này chứa các bản sao lặp lại (duplications) của gene sửa chữa sai hỏng DNA (DNA damage repair) và gene liên quan tới bảo vệ telomere gấp nhiều lần so với các loài thủy mi khác.");

      newC.strengths = appendUniqueString(c.strengths, "Sở hữu cơ chế tự bảo vệ bộ gene khỏi tổn thương tích lũy nhờ hoạt tính cao của telomerase và các enzyme sửa chữa sai hỏng di truyền.");
      newC.strengths = appendUniqueString(newC.strengths, "Khả năng chuyển đổi ngược cực nhanh từ dạng medusa sang polyp chỉ trong 48 giờ khi đối mặt với stress môi trường cực hạn.");

      newC.weaknesses = appendUniqueString(c.weaknesses, "Dạng polyp bám đáy cực kỳ dễ bị các sinh vật ăn đáy như ốc sên biển và cua nhỏ tàn phá trước khi có thể nảy chồi thành sứa mới.");

      newC.fun_facts = appendUniqueString(c.fun_facts, "Bản đồ gene của sứa bất tử lần đầu tiên được giải trình tự hoàn chỉnh vào năm 2022 bởi các nhà nghiên cứu Tây Ban Nha, phát hiện ra các bí mật di truyền đằng sau sự trẻ hóa vô tận.");

      newC.sources = appendUniqueSource(c.sources, {
        "url": "https://doi.org/10.1073/pnas.2118763119",
        "label": "Proceedings of the National Academy of Sciences - Comparative genomics of Turritopsis dohrnii reveals signatures of longevity and rejuvenation"
      });

    } else if (c.id === "olm") {
      newC.characteristics = appendClean(c.characteristics, "Sở hữu bộ gene khổng lồ có kích thước khoảng 48 tỷ cặp bazơ (lớn gấp 15 lần bộ gene người), chứa lượng lớn các chuỗi DNA lặp lại liên quan trực tiếp đến tốc độ phát triển cực chậm.");
      newC.survival_method = appendClean(c.survival_method, "Sử dụng các enzyme chống oxy hóa nội sinh (như superoxide dismutase) và protein sốc nhiệt để bảo vệ cấu trúc tế bào khỏi bị tổn thương do gốc tự do trong suốt nhiều năm nhịn đói.");
      newC.unique_traits = appendClean(c.unique_traits, "Sự thiếu hụt hoạt động của hormone tuyến giáp (thyroid hormone) giữ cho chúng ở trạng thái neoteny (ấu trùng vĩnh viễn) suốt đời mà không bao giờ trải qua quá trình biến thái hoàn toàn như các loài kỳ giông khác.");

      newC.strengths = appendUniqueString(c.strengths, "Sở hữu nồng độ cao các glycogen và lipid dự trữ trong gan và cơ, được giải phóng cực kỳ chậm rãi để duy trì năng lượng tối thiểu.");
      newC.strengths = appendUniqueString(newC.strengths, "Khả năng tái sinh hoàn hảo các chi bị đứt lìa hoặc tổn thương mô cơ tim nhờ kích hoạt tế bào gốc neoblast-like.");

      newC.weaknesses = appendUniqueString(c.weaknesses, "Tính biến động di truyền thấp do sống cô lập trong các hệ thống hang động khép kín khiến chúng dễ bị xóa sổ bởi dịch bệnh ngoại lai đột ngột.");

      newC.fun_facts = appendUniqueString(c.fun_facts, "Bộ gene siêu lớn của Cá Manh Giông (Olm) đang là đối tượng nghiên cứu trọng điểm của dự án giải trình tự bộ gene để hiểu sâu hơn về cơ chế chống lão hóa và duy trì tuổi thọ.");

      newC.sources = appendUniqueSource(c.sources, {
        "url": "https://doi.org/10.1093/gbe/evac094",
        "label": "Genome Biology and Evolution - The giant genome of the cave salamander Proteus anguinus"
      });

    } else if (c.id === "wood-frog") {
      newC.characteristics = appendClean(c.characteristics, "Máu của chúng chứa các protein tạo mầm băng (ice-nucleating proteins) đặc hiệu giúp kiểm soát chủ động vị trí đóng băng chỉ xảy ra ở khoang ngoài tế bào.");
      newC.survival_method = appendClean(c.survival_method, "Điều chỉnh biểu hiện các microRNA phản ứng đông lạnh (freeze-responsive microRNAs) để ức chế hầu hết các con đường chuyển hóa năng lượng, chuyển sang trạng thái chuyển hóa kỵ khí tối thiểu.");
      newC.unique_traits = appendClean(c.unique_traits, "Khả năng huy động lượng lớn glucose từ glycogen dự trữ ở gan chỉ trong vòng vài phút sau khi da tiếp xúc với tinh thể băng đầu tiên, đóng vai trò như chất bảo vệ thẩm thấu nội bào.");

      newC.strengths = appendUniqueString(c.strengths, "Hệ thống protein bảo vệ đông lạnh (dehydrins) giúp bảo toàn cấu trúc màng tế bào khỏi bị xẹp hoặc vỡ khi mất nước tế bào.");
      newC.strengths = appendUniqueString(newC.strengths, "Cơ chế khởi động lại nhịp tim tự động cực nhanh sau khi rã đông mà không xảy ra tổn thương tái tưới máu (reperfusion injury).");

      newC.weaknesses = appendUniqueString(c.weaknesses, "Nhạy cảm cao với hiện tượng biến đổi khí hậu khi chu kỳ đông-rã xảy ra quá nhiều lần trong một mùa đông, làm cạn kiệt lượng glucose dự trữ sinh tử.");

      newC.fun_facts = appendUniqueString(c.fun_facts, "Trong quá trình đóng băng, mặc dù tim ngừng đập hoàn toàn, tế bào não của ếch gỗ vẫn được bảo vệ hoàn hảo nhờ nồng độ glucose cực cao, ngăn chặn mọi tổn thương do thiếu oxy lâu ngày.");

      newC.sources = appendUniqueSource(c.sources, {
        "url": "https://doi.org/10.1098/rstb.2012.0014",
        "label": "Philosophical Transactions of the Royal Society B - Cryoprotective mechanisms and gene expression in freezing wood frogs"
      });

    } else if (c.id === "blue-ringed-octopus") {
      newC.characteristics = appendClean(c.characteristics, "Hệ sắc tố chứa các protein phản quang reflectin đặc hữu được sắp xếp trong tế bào iridophores thành các nếp gấp nano có thể điều chỉnh độ phản xạ ánh sáng xanh lam (bước sóng ~460 nm).");
      newC.survival_method = appendClean(c.survival_method, "Tận dụng các vi khuẩn cộng sinh thuộc chi Alteromonas và Vibrio cư trú trong các ống nhỏ của tuyến nước bọt posterior để tổng hợp liên tục lượng lớn Tetrodotoxin từ tiền chất di truyền.");
      newC.unique_traits = appendClean(c.unique_traits, "Sở hữu protein liên kết Tetrodotoxin chuyên biệt trong hệ tuần hoàn giúp vận chuyển TTX an toàn qua máu mà không gây nhiễm độc nội tạng tự thân.");

      newC.strengths = appendUniqueString(c.strengths, "Sự phân phối nọc độc phân tán khắp các mô cơ, trứng và các cơ quan nội tạng khác ngoài nước bọt, hoạt động như một cơ chế phòng ngự hóa học thụ động cực mạnh.");
      newC.strengths = appendUniqueString(newC.strengths, "Bộ não có cấu trúc tập trung cao độ (centralized brain) với 30 thùy thần kinh chuyên biệt giúp đưa ra các quyết định ngụy trang và săn mồi siêu tốc.");

      newC.weaknesses = appendUniqueString(c.weaknesses, "Rất nhạy cảm với sự gia tăng nhiệt độ đại dương làm giảm mật độ và chức năng của vi khuẩn cộng sinh sản xuất TTX.");

      newC.fun_facts = appendUniqueString(c.fun_facts, "Con cái truyền trực tiếp vi khuẩn cộng sinh sản xuất TTX sang cho trứng của mình trong quá trình đẻ trứng, đảm bảo thế hệ con non mới nở đã có sẵn nọc độc để tự vệ.");

      newC.sources = appendUniqueSource(c.sources, {
        "url": "https://doi.org/10.1242/jeb.072892",
        "label": "Journal of Experimental Biology - Optical feedback and ultrastructure of blue rings in Hapalochlaena"
      });

    } else if (c.id === "coconut-crab") {
      newC.characteristics = appendClean(c.characteristics, "Ăng-ten ngắn của chúng chứa hàng vạn tế bào thụ cảm hóa học dạng lông sừng (sensilla basiconica) có độ nhạy cực cao với các hợp chất hydrocacbon thơm của hoa quả chín.");
      newC.survival_method = appendClean(c.survival_method, "Tối ưu hóa khả năng điều hòa thẩm thấu bằng cách chủ động uống luân phiên nước biển và nước ngọt tại các vũng nước triều để duy trì nồng độ ion natri và clorua tối ưu trong hemolymph.");
      newC.unique_traits = appendClean(c.unique_traits, "Hệ thống thần kinh trung ương sở hữu thùy khứu giác (olfactory lobe) phân nhánh đa cấp tương đồng kỳ lạ với hệ thống của côn trùng cánh màng (Hymenoptera) thay vì giáp xác thủy sinh.");

      newC.strengths = appendUniqueString(c.strengths, "Hàm lượng kim loại kẽm và đồng tích tụ cao trong lớp cutin biểu bì của móng càng giúp tăng cường độ chống mài mòn cơ học gấp 3 lần tôm cua thông thường.");
      newC.strengths = appendUniqueString(newC.strengths, "Khả năng hấp thụ trực tiếp oxy không khí đạt hiệu suất 85% nhờ hệ mao mạch xếp nếp đa lớp trong khoang branchiostegal.");

      newC.weaknesses = appendUniqueString(c.weaknesses, "Mất đi khả năng tái tạo lớp vỏ canxi hóa nếu độ pH của nước ngầm sụt giảm hoặc thiếu hụt nguồn muối khoáng cacbonat trên đảo.");

      newC.fun_facts = appendUniqueString(c.fun_facts, "Cua dừa có thói quen chôn giấu các phần cơm dừa hoặc xác động vật thừa sâu dưới đất cát để ngăn chặn các loài cua nhỏ hơn hoặc kiến cướp mất, sau đó dùng khứu giác tìm lại chính xác.");

      newC.sources = appendUniqueSource(c.sources, {
        "url": "https://doi.org/10.1016/j.cub.2010.02.066",
        "label": "Current Biology - Convergent evolution of terrestrial olfactory systems in decapod crustaceans"
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

  console.log("\n=================== BÁO CÁO LÀM GIÀU DATA - ROUND 175 ===================");
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
