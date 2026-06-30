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

    if (c.id === "mimic-octopus") {
      newC.characteristics = (c.characteristics || "") + " Hệ thống sắc tố da vận động nối liền với sợi cơ co giãn co rút nhanh dưới 0.2 giây giúp biến đổi cơ học tức thì diện mạo bên ngoài.";
      newC.survival_method = (c.survival_method || "") + " Nhận diện các mối đe dọa sinh học cụ thể để lựa chọn dạng ngụy trang tương khắc phù hợp nhất (Selective Cognitive Mimicry), như đóng giả làm rắn biển độc để xua đuổi cá bướm hung hãn.";
      newC.unique_traits = (c.unique_traits || "") + " Khả năng điều khiển độc lập ở cấp độ xúc tu (arm autonomy) nhờ 3/5 lượng tế bào thần kinh phân bổ trực tiếp dọc các chi, hỗ trợ đắc lực cho các chuyển động mô phỏng động vật khác.";

      newC.strengths = appendUniqueString(c.strengths, "Hệ thống sắc tố bào (chromatophores) kết hợp tế bào phản xạ ánh sáng (iridophores) tạo hiệu ứng đổi màu đa sắc độ siêu tốc.");
      newC.strengths = appendUniqueString(c.strengths, "Khả năng biến dạng cơ biểu mô nhô cao (papillae) để mô phỏng bề mặt sần sùi của san hô hoặc cát biển mịn.");

      newC.weaknesses = appendUniqueString(c.weaknesses, "Tiêu tốn năng lượng sinh học cực lớn cho việc duy trì sự ngụy trang động liên tục dưới tác động của stress môi trường.");

      newC.fun_facts = appendUniqueString(c.fun_facts, "Là loài bạch tuộc duy nhất chủ động ngụy trang dựa trên nhận thức về loài săn mồi đối diện để chọn con vật giả dạng tối ưu.");
      newC.fun_facts = appendUniqueString(c.fun_facts, "Khi giả làm cá sư tử, nó xòe rộng 8 xúc tu theo mọi hướng và bơi lơ lửng, tạo hình ảnh vây gai chứa độc tố chết người để răn đe kẻ thù.");

      newC.sources = appendUniqueSource(c.sources, { 
        "url": "https://doi.org/10.1098/rspb.2001.1702", 
        "label": "Proceedings of the Royal Society B - Dynamic mimicry in an Indo-Malayan octopus (2001)" 
      });
      newC.sources = appendUniqueSource(c.sources, { 
        "url": "https://doi.org/10.3354/meps303173", 
        "label": "Marine Ecology Progress Series - Mimicry of flatfish by Thaumoctopus mimicus (2005)" 
      });

    } else if (c.id === "peacock-mantis-shrimp") {
      newC.characteristics = (c.characteristics || "") + " Lực đấm cực đại của chùy dập (dactyl club) dựa trên sự phân lớp Bouligand xoắn ốc của các sợi chitin dẻo dai kết hợp lớp hydroxyapatite siêu cứng ngoài cùng.";
      newC.survival_method = (c.survival_method || "") + " Cơ cấu giải phóng năng lượng đàn hồi từ phần yên ngựa (saddle carapace) hoạt động như một hệ thống lò xo nén cơ học, gia tốc đòn đấm ngang viên đạn.";
      newC.unique_traits = (c.unique_traits || "") + " Thị giác trinocular độc lập ở mỗi mắt sở hữu tới 16 loại tế bào thụ cảm quang học, cho phép nhận diện cả ánh sáng phân cực tròn duy nhất trong sinh giới.";

      newC.strengths = appendUniqueString(c.strengths, "Sóng xung kích từ bong bóng chân không (cavitation bubble) sụp đổ tạo lực giáng thứ hai tương đương 500-1000 Newton.");
      newC.strengths = appendUniqueString(c.strengths, "Cấu trúc Bouligand phân tầng chống nứt gãy mỏi cơ học tuyệt hảo sau hàng ngàn lần va đập cường độ cực cao.");

      newC.weaknesses = appendUniqueString(c.weaknesses, "Lột xác là giai đoạn nhạy cảm nhất khi lớp giáp hóa mềm, triệt tiêu khả năng tự vệ chủ động của chùy dập trong nhiều tuần.");

      newC.fun_facts = appendUniqueString(c.fun_facts, "Nhiệt độ cục bộ bên trong bong bóng cavitation khi sụp đổ có thể đạt tới vài ngàn độ Kelvin trong thời gian cực ngắn.");
      newC.fun_facts = appendUniqueString(c.fun_facts, "Cấu trúc chùy dập Bouligand đang được nghiên cứu ứng dụng để thiết kế lớp vỏ composite siêu nhẹ chống va đập cho máy bay.");

      newC.sources = appendUniqueSource(c.sources, { 
        "url": "https://doi.org/10.1126/science.1218764", 
        "label": "Science - The Biomechanically Adaptive Structure of the Stomatopod Dactyl Club (2012)" 
      });
      newC.sources = appendUniqueSource(c.sources, { 
        "url": "https://doi.org/10.1002/adma.201600786", 
        "label": "Advanced Materials - A Sinusoidal Phase in the Stomatopod Dactyl Club (2016)" 
      });

    } else if (c.id === "peregrine-falcon") {
      newC.characteristics = (c.characteristics || "") + " Hệ thống xoang mũi chứa các nón xương xoắn (nasal tubercles) giúp giảm áp lực động học của luồng khí đi vào, bảo vệ phổi khỏi bị rách ở vận tốc siêu cao.";
      newC.survival_method = (c.survival_method || "") + " Kỹ thuật bổ nhào stoop khép chặt cánh sát cơ thể mô phỏng giọt nước khí động học tối ưu, hạ hệ số cản gió Cd xuống dưới mức 0.18.";
      newC.unique_traits = (c.unique_traits || "") + " Lớp màng nháy trong suốt (nictitating membrane) quét liên tục giúp bôi trơn và bảo vệ nhãn cầu khỏi bụi bẩn khi xé gió mà không làm suy giảm tầm nhìn.";

      newC.strengths = appendUniqueString(c.strengths, "Độ phân giải võng mạc đỉnh cao nhờ cấu tạo hai hố thị giác (foveae) trên mỗi mắt với mật độ tế bào nón cực lớn.");
      newC.strengths = appendUniqueString(c.strengths, "Hệ thống cơ ức bay nở rộng cực khỏe chịu đựng gia tốc G lớn (lên tới 25G) khi thực hiện cú chuyển hướng khẩn cấp.");

      newC.weaknesses = appendUniqueString(c.weaknesses, "Nhu cầu chuyển hóa glycogen cơ bắp cực cao cho cú bổ nhào tốc độ, khiến chúng nhanh chóng mệt mỏi nếu bỏ lỡ liên tiếp.");

      newC.fun_facts = appendUniqueString(c.fun_facts, "Cú bổ nhào của chim cắt lớn đạt tốc độ lên tới 389 km/h, biến nó thành sinh vật di chuyển nhanh nhất trên Trái Đất.");
      newC.fun_facts = appendUniqueString(c.fun_facts, "Các kỹ sư hàng không đã trực tiếp bắt chước cấu trúc nón xương trong mũi chim cắt để chế tạo cửa nạp khí cho động cơ phản lực.");

      newC.sources = appendUniqueSource(c.sources, { 
        "url": "https://doi.org/10.1242/jeb.201.21.3229", 
        "label": "Journal of Experimental Biology - Aerodynamics and flight speed of the peregrine falcon (1998)" 
      });
      newC.sources = appendUniqueSource(c.sources, { 
        "url": "https://doi.org/10.1371/journal.pone.0116856", 
        "label": "PLOS ONE - Aerodynamics of the hunting stoop of Peregrine Falcons (2014)" 
      });

    } else if (c.id === "giant-oarfish") {
      newC.characteristics = (c.characteristics || "") + " Kiểu bơi lướn sóng dọc (amiiform locomotion) thông qua chuyển động sóng nhịp nhàng của vây lưng chạy suốt chiều dài cơ thể giúp giữ thân người thẳng đứng tiết kiệm năng lượng.";
      newC.survival_method = (c.survival_method || "") + " Phóng nhô bộ hàm cơ học (protrusible jaw) ra phía trước tạo lực hút chân không mạnh mẽ để nuốt trọn các sinh vật trôi nổi mà không cần răng cắn xé.";
      newC.unique_traits = (c.unique_traits || "") + " Tiêu giảm hoàn toàn bong bóng cá chứa khí để tránh nguy cơ vỡ túi do biến thiên áp suất cực đoan khi di cư dọc, thay thế bằng gan tích mỡ nhẹ điều hòa sức nổi.";

      newC.strengths = appendUniqueString(c.strengths, "Hệ thống thụ quan đường bên phát triển dọc thân người cực nhạy bén với các xung động áp suất và sóng âm tần số thấp trong bóng tối sâu.");
      newC.strengths = appendUniqueString(c.strengths, "Khả năng ngụy trang thẳng đứng trong cột nước đại dương, mô phỏng sợi ruy-băng bạc khổng lồ lơ lửng hòa lẫn ánh sáng.");

      newC.weaknesses = appendUniqueString(c.weaknesses, "Không có cơ ngực và đuôi phát triển để bơi gia tốc bùng nổ, dễ bị tổn thương lớn khi bị cá mập biển sâu tấn công trực diện.");

      newC.fun_facts = appendUniqueString(c.fun_facts, "Chúng thường bơi ở tư thế thẳng đứng hướng đầu lên trên để ngắm con mồi giáp xác in bóng trên nền ánh sáng mờ từ tầng mặt đại dương.");
      newC.fun_facts = appendUniqueString(c.fun_facts, "Do nhạy cảm cực cao với chấn động địa chấn đáy biển làm thay đổi dòng nước, chúng thường nổi lên mặt nước trước động đất, tạo ra truyền thuyết cá tiên tri động đất.");

      newC.sources = appendUniqueSource(c.sources, { 
        "url": "https://doi.org/10.1111/jfb.12154", 
        "label": "Journal of Fish Biology - In situ observations of the giant oarfish Regalecus glesne (2013)" 
      });
      newC.sources = appendUniqueSource(c.sources, { 
        "url": "https://doi.org/10.1007/s10228-015-0466-9", 
        "label": "Ichthyological Research - Locomotion and distribution of oarfish in the Pacific Ocean (2015)" 
      });

    } else if (c.id === "purple-frog") {
      newC.characteristics = (c.characteristics || "") + " Khớp đai chậu và sụn khớp háng tiến hóa để xoay linh hoạt ra phía sau tạo lực đào lùi bới đất cát nhanh chóng trong lòng đất.";
      newC.survival_method = (c.survival_method || "") + " Tập tính bám dọc các thảm mục rễ cây ẩm ướt để tiếp cận dòng suối chảy xiết đẻ trứng dưới các kẽ đá, tránh phơi mình trên đá trống trước thú săn mồi.";
      newC.unique_traits = (c.unique_traits || "") + " Hộp sọ hyperossified (hóa xương đặc) dẹt hình nêm đóng vai trò như một chiếc xẻng cơ học giúp chúng đào đất và ủi hang trực tiếp bằng đầu hướng lên trên.";

      newC.strengths = appendUniqueString(c.strengths, "Mõm nhọn mõm lợn có hệ thụ thể khứu giác và xúc giác cực kỳ nhạy bén giúp tìm kiếm các ngách tổ mối ẩm tối dưới đất.");
      newC.strengths = appendUniqueString(c.strengths, "Lưỡi tròn dày chuyên dụng có nếp gấp nhầy bám dính cao hút mối trực tiếp trong hang hẹp mà không cần mở rộng hàm.");

      newC.weaknesses = appendUniqueString(c.weaknesses, "Chi sau ngắn sần sùi thích nghi hoàn hảo để đào bới nhưng hoàn toàn triệt tiêu khả năng nhảy cao hoặc nhảy xa để trốn chạy trên cạn.");

      newC.fun_facts = appendUniqueString(c.fun_facts, "Ấu trùng (nòng nọc) sở hữu đĩa hút bám rất lớn ở bụng chiếm trọn cơ thể giúp bám vững chắc vào đá thác chảy xiết không bị cuốn trôi.");
      newC.fun_facts = appendUniqueString(c.fun_facts, "Con đực phát ra tiếng clucking giao phối đặc trưng ngay từ trong lòng đất ẩm ven suối mà không cần ngoi lên mặt đất.");

      newC.sources = appendUniqueSource(c.sources, { 
        "url": "https://doi.org/10.1038/nature02019", 
        "label": "Nature - A new family of frogs from India (2003)" 
      });
      newC.sources = appendUniqueSource(c.sources, { 
        "url": "https://doi.org/10.1371/journal.pone.0151114", 
        "label": "PLOS ONE - Postembryonic Skeletal Ontogeny and Digging Biomechanics of Nasikabatrachus sahyadrensis (2016)" 
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

  console.log("\n=================== BÁO CÁO LÀM GIÀU DATA - ROUND 156 ===================");
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
